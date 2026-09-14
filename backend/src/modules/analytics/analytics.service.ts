import { prisma } from '../../db/client';
import {
  CompanyAnalyticsSummaryDto,
  CompanyFunnelResponseDto,
  FunnelStageMetricDto,
  CompanySourcesResponseDto,
  SourceAttributionDto,
  ApplicationVelocityResponseDto,
  ApplicationVelocityPointDto,
  AtsScoreDistributionDto,
  DiversityAnalyticsDto,
  DiversityCategoryCountDto,
  CandidateExportItemDto,
  CandidateExportResponseDto,
  ScoreBand,
} from '@recruitment-platform/shared';
import {
  AnalyticsFilterQuery,
  ExportFilterQuery,
  SubmitDiversitySurveyInput,
} from './analytics.types';

export class AnalyticsService {
  /**
   * Builds the base Prisma where clause for applications belonging to a company with filters
   */
  private buildApplicationWhere(companyId: string, filters: { jobId?: string; startDate?: string; endDate?: string }) {
    const where: any = {
      job: {
        companyId,
        ...(filters.jobId ? { id: filters.jobId } : {}),
      },
    };

    if (filters.startDate || filters.endDate) {
      where.appliedAt = {};
      if (filters.startDate) {
        where.appliedAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        // End of the day if date-only string
        const end = new Date(filters.endDate);
        if (filters.endDate.length === 10) {
          end.setHours(23, 59, 59, 999);
        }
        where.appliedAt.lte = end;
      }
    }

    return where;
  }

  /**
   * 1. Company Summary & Executive KPI Cards (FR-RC-21)
   */
  async getCompanySummary(
    companyId: string,
    filters: Partial<AnalyticsFilterQuery> = {}
  ): Promise<CompanyAnalyticsSummaryDto> {
    const where = this.buildApplicationWhere(companyId, filters);

    // Active Jobs count
    const activeJobs = await prisma.jobVacancy.count({
      where: {
        companyId,
        status: 'PUBLISHED',
      },
    });

    // Current period applications
    const applications = await prisma.application.findMany({
      where,
      select: {
        id: true,
        status: true,
        appliedAt: true,
        updatedAt: true,
        atsScore: {
          select: {
            overallScore: true,
          },
        },
        jobOffer: {
          select: {
            status: true,
          },
        },
        candidatePipelines: {
          select: {
            movedAt: true,
            stage: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const totalApplications = applications.length;

    // Average ATS Match Score
    const scoredApps = applications.filter((app) => app.atsScore?.overallScore != null);
    const avgAtsScore =
      scoredApps.length > 0
        ? Number(
            (
              scoredApps.reduce(
                (sum, app) => sum + Number(app.atsScore!.overallScore),
                0
              ) / scoredApps.length
            ).toFixed(1)
          )
        : 0;

    // Time-to-hire calculation (days from appliedAt to HIRED)
    const hiredApps = applications.filter(
      (app) =>
        app.status === 'HIRED' ||
        app.candidatePipelines.some((cp) => cp.stage.name.toUpperCase() === 'HIRED')
    );

    let avgTimeToHireDays = 0;
    if (hiredApps.length > 0) {
      const totalDays = hiredApps.reduce((acc, app) => {
        const hirePipeline = app.candidatePipelines.find(
          (cp) => cp.stage.name.toUpperCase() === 'HIRED'
        );
        const hireDate = hirePipeline ? new Date(hirePipeline.movedAt) : new Date(app.updatedAt);
        const diffMs = Math.max(0, hireDate.getTime() - new Date(app.appliedAt).getTime());
        return acc + diffMs / (1000 * 60 * 60 * 24);
      }, 0);
      avgTimeToHireDays = Number((totalDays / hiredApps.length).toFixed(1));
    }

    // Offer Acceptance Rate
    const allOffers = applications.filter((app) => app.jobOffer != null);
    const acceptedOffers = allOffers.filter((app) => app.jobOffer?.status === 'ACCEPTED');
    const offerAcceptanceRate =
      allOffers.length > 0
        ? Number(((acceptedOffers.length / allOffers.length) * 100).toFixed(1))
        : 0;

    // Pipeline Velocity (average days across all applications from appliedAt to now or terminal state)
    let pipelineVelocityDays = 0;
    if (totalApplications > 0) {
      const now = Date.now();
      const totalVelocityDays = applications.reduce((sum, app) => {
        const isTerminal =
          app.status === 'HIRED' || app.status === 'REJECTED' || app.status === 'WITHDRAWN';
        const endDate = isTerminal ? new Date(app.updatedAt).getTime() : now;
        const days = Math.max(0, (endDate - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      pipelineVelocityDays = Number((totalVelocityDays / totalApplications).toFixed(1));
    }

    // Period-over-period trend calculation
    let applicationsTrendPercent = 0;
    let timeToHireTrendDays = 0;
    let offerAcceptanceTrendPercent = 0;
    let atsScoreTrendPercent = 0;

    // Calculate previous period if dates are given or default to 30-day window
    const now = new Date();
    const currStart = filters.startDate ? new Date(filters.startDate) : new Date(now.getTime() - 30 * 86400000);
    const currEnd = filters.endDate ? new Date(filters.endDate) : now;
    const durationMs = Math.max(86400000, currEnd.getTime() - currStart.getTime());

    const prevStart = new Date(currStart.getTime() - durationMs);
    const prevEnd = new Date(currStart.getTime());

    const prevWhere: any = {
      job: {
        companyId,
        ...(filters.jobId ? { id: filters.jobId } : {}),
      },
      appliedAt: {
        gte: prevStart,
        lt: prevEnd,
      },
    };

    const prevApplications = await prisma.application.findMany({
      where: prevWhere,
      select: {
        id: true,
        status: true,
        appliedAt: true,
        updatedAt: true,
        atsScore: { select: { overallScore: true } },
        jobOffer: { select: { status: true } },
        candidatePipelines: {
          select: {
            movedAt: true,
            stage: { select: { name: true } },
          },
        },
      },
    });

    if (prevApplications.length > 0) {
      applicationsTrendPercent = Number(
        (
          ((totalApplications - prevApplications.length) / prevApplications.length) *
          100
        ).toFixed(1)
      );

      const prevScored = prevApplications.filter((a) => a.atsScore?.overallScore != null);
      if (prevScored.length > 0 && avgAtsScore > 0) {
        const prevAvgScore =
          prevScored.reduce((sum, a) => sum + Number(a.atsScore!.overallScore), 0) /
          prevScored.length;
        atsScoreTrendPercent = Number((avgAtsScore - prevAvgScore).toFixed(1));
      }

      const prevHired = prevApplications.filter(
        (a) =>
          a.status === 'HIRED' ||
          a.candidatePipelines.some((cp) => cp.stage.name.toUpperCase() === 'HIRED')
      );
      if (prevHired.length > 0 && avgTimeToHireDays > 0) {
        const prevHireDays =
          prevHired.reduce((sum, a) => {
            const hireCp = a.candidatePipelines.find(
              (cp) => cp.stage.name.toUpperCase() === 'HIRED'
            );
            const hDate = hireCp ? new Date(hireCp.movedAt) : new Date(a.updatedAt);
            return sum + Math.max(0, (hDate.getTime() - new Date(a.appliedAt).getTime()) / 86400000);
          }, 0) / prevHired.length;
        timeToHireTrendDays = Number((avgTimeToHireDays - prevHireDays).toFixed(1));
      }

      const prevOffers = prevApplications.filter((a) => a.jobOffer != null);
      const prevAccepted = prevOffers.filter((a) => a.jobOffer?.status === 'ACCEPTED');
      if (prevOffers.length > 0) {
        const prevOfferRate = (prevAccepted.length / prevOffers.length) * 100;
        offerAcceptanceTrendPercent = Number((offerAcceptanceRate - prevOfferRate).toFixed(1));
      }
    }

    return {
      totalApplications,
      activeJobs,
      avgAtsScore,
      avgTimeToHireDays,
      offerAcceptanceRate,
      pipelineVelocityDays,
      trends: {
        applicationsTrendPercent,
        timeToHireTrendDays,
        offerAcceptanceTrendPercent,
        atsScoreTrendPercent,
      },
    };
  }

  /**
   * 2. Recruitment Funnel & Conversion Rates (FR-RC-21)
   */
  async getFunnelMetrics(
    companyId: string,
    filters: Partial<AnalyticsFilterQuery> = {}
  ): Promise<CompanyFunnelResponseDto> {
    const where = this.buildApplicationWhere(companyId, filters);

    const applications = await prisma.application.findMany({
      where,
      select: {
        id: true,
        status: true,
        jobOffer: { select: { id: true, status: true } },
        interviewSchedules: { select: { id: true } },
        candidatePipelines: {
          select: {
            stage: {
              select: { name: true },
            },
          },
        },
      },
    });

    const totalApplications = applications.length;

    // Stage order: APPLIED -> SCREENING -> SHORTLISTED -> INTERVIEW -> OFFER -> HIRED
    const hasReachedStage = (app: (typeof applications)[0], targetStage: string): boolean => {
      const stageOrder = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED'];
      const targetIndex = stageOrder.indexOf(targetStage);

      // Check current status
      const currentStatus = app.status as string;
      const currentIndex = stageOrder.indexOf(currentStatus);
      if (currentIndex >= targetIndex && currentIndex !== -1) return true;

      // Check pipeline transitions
      if (
        app.candidatePipelines.some((cp) => {
          const cpIndex = stageOrder.indexOf(cp.stage.name.toUpperCase());
          return cpIndex >= targetIndex;
        })
      ) {
        return true;
      }

      // Check explicit relations
      if (targetStage === 'INTERVIEW' && app.interviewSchedules.length > 0) return true;
      if (targetStage === 'OFFER' && app.jobOffer != null) return true;
      if (targetStage === 'HIRED' && (app.status === 'HIRED' || app.jobOffer?.status === 'ACCEPTED')) {
        return true;
      }

      return false;
    };

    const stageDefinitions = [
      { key: 'APPLIED', label: 'Applied' },
      { key: 'SCREENING', label: 'Screening' },
      { key: 'SHORTLISTED', label: 'Shortlisted' },
      { key: 'INTERVIEW', label: 'Interview' },
      { key: 'OFFER', label: 'Offer' },
      { key: 'HIRED', label: 'Hired' },
    ];

    const stages: FunnelStageMetricDto[] = [];
    let prevCount = totalApplications;

    for (let i = 0; i < stageDefinitions.length; i++) {
      const def = stageDefinitions[i];
      let count = 0;

      if (def.key === 'APPLIED') {
        count = totalApplications;
      } else {
        count = applications.filter((app) => hasReachedStage(app, def.key)).length;
      }

      const percentageOfTotal =
        totalApplications > 0 ? Number(((count / totalApplications) * 100).toFixed(1)) : 0;
      const conversionFromPrev =
        i === 0 ? 100 : prevCount > 0 ? Number(((count / prevCount) * 100).toFixed(1)) : 0;
      const dropOffCount = Math.max(0, prevCount - count);
      const dropOffPercentage =
        prevCount > 0 ? Number(((dropOffCount / prevCount) * 100).toFixed(1)) : 0;

      stages.push({
        stage: def.key,
        label: def.label,
        count,
        percentageOfTotal,
        conversionFromPrev,
        dropOffCount,
        dropOffPercentage,
      });

      prevCount = count;
    }

    const totalHired = stages.find((s) => s.stage === 'HIRED')?.count || 0;
    const overallConversionRate =
      totalApplications > 0 ? Number(((totalHired / totalApplications) * 100).toFixed(1)) : 0;

    return {
      stages,
      totalApplications,
      totalHired,
      overallConversionRate,
    };
  }

  /**
   * 3. Candidate Source Attribution (FR-RC-21)
   */
  async getSourceAttribution(
    companyId: string,
    filters: Partial<AnalyticsFilterQuery> = {}
  ): Promise<CompanySourcesResponseDto> {
    const where = this.buildApplicationWhere(companyId, filters);

    const applications = await prisma.application.findMany({
      where,
      select: {
        source: true,
      },
    });

    const total = applications.length;
    const sourceCounts: Record<string, number> = {};

    applications.forEach((app) => {
      const src = (app.source || 'DIRECT').toUpperCase();
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    const sourceLabels: Record<string, string> = {
      DIRECT: 'Direct Application',
      LINKEDIN: 'LinkedIn',
      REFERRAL: 'Employee Referral',
      JOB_BOARD: 'Job Board',
      INTERNAL: 'Internal Mobility',
      OTHER: 'Other Channels',
    };

    const sources: SourceAttributionDto[] = Object.entries(sourceCounts).map(([src, count]) => {
      return {
        source: src,
        label: sourceLabels[src] || src,
        count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      };
    });

    // Sort descending by count
    sources.sort((a, b) => b.count - a.count);

    return {
      sources,
      total,
    };
  }

  /**
   * 4. Application Velocity Trends (Daily, Weekly, Monthly) (FR-RC-21)
   */
  async getApplicationVelocity(
    companyId: string,
    filters: Partial<AnalyticsFilterQuery> = {}
  ): Promise<ApplicationVelocityResponseDto> {
    const where = this.buildApplicationWhere(companyId, filters);

    const applications = await prisma.application.findMany({
      where,
      select: {
        appliedAt: true,
      },
      orderBy: {
        appliedAt: 'asc',
      },
    });

    const interval = filters.interval || 'day';
    const pointMap: Record<string, number> = {};

    applications.forEach((app) => {
      const d = new Date(app.appliedAt);
      let key = '';

      if (interval === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (interval === 'week') {
        // Find beginning of week (Monday)
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      } else {
        // Daily
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      pointMap[key] = (pointMap[key] || 0) + 1;
    });

    const points: ApplicationVelocityPointDto[] = Object.entries(pointMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => {
        return {
          date,
          label: date,
          count,
        };
      });

    return {
      interval,
      points,
      total: applications.length,
    };
  }

  /**
   * 5. ATS Score Distribution (Strong, Partial, Weak) (FR-RC-21)
   */
  async getScoreDistribution(
    companyId: string,
    filters: Partial<AnalyticsFilterQuery> = {}
  ): Promise<AtsScoreDistributionDto> {
    const where = this.buildApplicationWhere(companyId, filters);

    const applications = await prisma.application.findMany({
      where,
      select: {
        atsScore: {
          select: {
            overallScore: true,
            scoreBand: true,
          },
        },
      },
    });

    const scored = applications
      .map((a) => a.atsScore)
      .filter((s): s is NonNullable<typeof s> => s != null && s.overallScore != null);

    const totalScored = scored.length;
    let strongMatchCount = 0;
    let partialMatchCount = 0;
    let weakMatchCount = 0;
    let scoreSum = 0;

    scored.forEach((s) => {
      const score = Number(s.overallScore);
      scoreSum += score;
      if (score >= 80) {
        strongMatchCount++;
      } else if (score >= 50) {
        partialMatchCount++;
      } else {
        weakMatchCount++;
      }
    });

    const averageScore = totalScored > 0 ? Number((scoreSum / totalScored).toFixed(1)) : 0;
    const strongMatchPercentage =
      totalScored > 0 ? Number(((strongMatchCount / totalScored) * 100).toFixed(1)) : 0;
    const partialMatchPercentage =
      totalScored > 0 ? Number(((partialMatchCount / totalScored) * 100).toFixed(1)) : 0;
    const weakMatchPercentage =
      totalScored > 0 ? Number(((weakMatchCount / totalScored) * 100).toFixed(1)) : 0;

    return {
      strongMatchCount,
      strongMatchPercentage,
      partialMatchCount,
      partialMatchPercentage,
      weakMatchCount,
      weakMatchPercentage,
      totalScored,
      averageScore,
    };
  }

  /**
   * 6. Diversity & Inclusion Analytics with k-Anonymity (k >= 5) (FR-RC-23)
   */
  async getDiversityAnalytics(
    companyId: string,
    filters: { jobId?: string }
  ): Promise<DiversityAnalyticsDto> {
    const responses = await prisma.diversitySurveyResponse.findMany({
      where: {
        companyId,
        ...(filters.jobId ? { jobId: filters.jobId } : {}),
        optedIn: true,
      },
      select: {
        gender: true,
        raceEthnicity: true,
        veteranStatus: true,
        disabilityStatus: true,
      },
    });

    const totalRespondents = responses.length;

    // k-Anonymity threshold (k >= 5)
    if (totalRespondents < 5) {
      return {
        totalRespondents,
        isProtected: true,
        protectionMessage:
          'Sample size too small (< 5 respondents) to display demographic breakdowns under k-anonymity privacy protection rules.',
        genderBreakdown: [],
        raceBreakdown: [],
        veteranBreakdown: [],
        disabilityBreakdown: [],
      };
    }

    // Helper to calculate breakdown
    const computeBreakdown = (field: keyof (typeof responses)[0]): DiversityCategoryCountDto[] => {
      const counts: Record<string, number> = {};
      responses.forEach((r) => {
        const val = r[field] || 'Prefer not to say';
        counts[val] = (counts[val] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([category, count]) => ({
          category,
          count,
          percentage: Number(((count / totalRespondents) * 100).toFixed(1)),
        }))
        .sort((a, b) => b.count - a.count);
    };

    return {
      totalRespondents,
      isProtected: false,
      genderBreakdown: computeBreakdown('gender'),
      raceBreakdown: computeBreakdown('raceEthnicity'),
      veteranBreakdown: computeBreakdown('veteranStatus'),
      disabilityBreakdown: computeBreakdown('disabilityStatus'),
    };
  }

  /**
   * Submit voluntary diversity survey (Applicant-facing)
   */
  async submitDiversitySurvey(input: SubmitDiversitySurveyInput): Promise<{ success: boolean; id: string }> {
    const record = await prisma.diversitySurveyResponse.create({
      data: {
        applicationId: input.applicationId || null,
        companyId: input.companyId,
        jobId: input.jobId || null,
        gender: input.gender || null,
        raceEthnicity: input.raceEthnicity || null,
        veteranStatus: input.veteranStatus || null,
        disabilityStatus: input.disabilityStatus || null,
        optedIn: input.optedIn,
      },
    });

    return {
      success: true,
      id: record.id,
    };
  }

  /**
   * 7. Candidate Pipeline Reports & Export Engine (FR-RC-22)
   */
  async exportCandidateReports(
    companyId: string,
    filters: ExportFilterQuery
  ): Promise<CandidateExportResponseDto> {
    const where: any = {
      job: {
        companyId,
        ...(filters.jobId ? { id: filters.jobId } : {}),
      },
    };

    if (filters.stage) {
      where.status = filters.stage;
    }

    if (filters.scoreBand) {
      where.atsScore = {
        scoreBand: filters.scoreBand as ScoreBand,
      };
    }

    if (filters.startDate || filters.endDate) {
      where.appliedAt = {};
      if (filters.startDate) where.appliedAt.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        if (filters.endDate.length === 10) end.setHours(23, 59, 59, 999);
        where.appliedAt.lte = end;
      }
    }

    const applications = await prisma.application.findMany({
      where,
      select: {
        id: true,
        status: true,
        source: true,
        appliedAt: true,
        updatedAt: true,
        applicant: {
          select: {
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        job: {
          select: {
            title: true,
          },
        },
        atsScore: {
          select: {
            overallScore: true,
            scoreBand: true,
          },
        },
      },
      orderBy: {
        appliedAt: 'desc',
      },
    });

    const now = Date.now();
    const candidates: CandidateExportItemDto[] = applications.map((app) => {
      const appliedTime = new Date(app.appliedAt).getTime();
      const isTerminal = app.status === 'HIRED' || app.status === 'REJECTED' || app.status === 'WITHDRAWN';
      const endTime = isTerminal ? new Date(app.updatedAt).getTime() : now;
      const timeInPipelineDays = Number(Math.max(0, (endTime - appliedTime) / 86400000).toFixed(1));

      return {
        applicationId: app.id,
        candidateName: `${app.applicant.firstName} ${app.applicant.lastName}`.trim(),
        candidateEmail: app.applicant.user.email,
        jobTitle: app.job.title,
        stage: app.status,
        atsScore: app.atsScore?.overallScore ? Number(app.atsScore.overallScore) : null,
        scoreBand: app.atsScore?.scoreBand || null,
        source: app.source || 'DIRECT',
        appliedAt: app.appliedAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        timeInPipelineDays,
      };
    });

    return {
      totalCandidates: candidates.length,
      exportedAt: new Date().toISOString(),
      candidates,
    };
  }

  /**
   * Helper to format candidates list as CSV with CSV-injection protection
   */
  generateCsvReport(candidates: CandidateExportItemDto[]): string {
    const headers = [
      'Application ID',
      'Candidate Name',
      'Candidate Email',
      'Job Requisition',
      'Pipeline Stage',
      'ATS Match Score',
      'Score Band',
      'Acquisition Source',
      'Applied Date',
      'Days in Pipeline',
    ];

    const escapeCsv = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val);

      // Formula injection prevention: if starts with =, +, -, @, prepend '
      if (/^[=+\-@]/.test(str)) {
        str = `'${str}`;
      }

      // Escape quotes and wrap in quotes
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = candidates.map((c) => [
      escapeCsv(c.applicationId),
      escapeCsv(c.candidateName),
      escapeCsv(c.candidateEmail),
      escapeCsv(c.jobTitle),
      escapeCsv(c.stage),
      escapeCsv(c.atsScore !== null ? `${c.atsScore}%` : 'N/A'),
      escapeCsv(c.scoreBand || 'N/A'),
      escapeCsv(c.source),
      escapeCsv(c.appliedAt.substring(0, 10)),
      escapeCsv(c.timeInPipelineDays),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }
}

export const analyticsService = new AnalyticsService();
