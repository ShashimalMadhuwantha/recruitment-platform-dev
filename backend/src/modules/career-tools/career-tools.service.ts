import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../middleware/error.middleware';
import type {
  CvHealthCheckResultDto,
  CvHealthIssueDto,
  ProfileImprovementResponseDto,
  ProfileImprovementSuggestionDto,
} from '@recruitment-platform/shared';

const prisma = new PrismaClient();

const STRONG_ACTION_VERBS = [
  'led',
  'spearheaded',
  'developed',
  'designed',
  'architected',
  'managed',
  'engineered',
  'implemented',
  'optimized',
  'reduced',
  'increased',
  'delivered',
  'automated',
  'scaled',
  'built',
  'launched',
  'created',
  'resolved',
  'improved',
  'orchestrated',
  'streamlined',
  'mentored',
  'formulated',
  'executed',
  'transformed',
];

const OVERUSED_BUZZWORDS = [
  'rockstar',
  'ninja',
  'guru',
  'synergy',
  'go-getter',
  'hardworking',
  'team player',
  'out-of-the-box',
  'dynamic',
  'detail-oriented',
];

const COMMON_STOP_WORDS = new Set([
  'the', 'and', 'with', 'for', 'that', 'this', 'from', 'have', 'were', 'been',
  'will', 'your', 'about', 'into', 'over', 'after', 'other', 'their', 'which',
  'more', 'also', 'some', 'than', 'them', 'work', 'working',
]);

export class CareerToolsService {
  /**
   * Run automated CV health check diagnostic (FR-AP-24)
   */
  async runCvHealthCheck(userId: string, cvId?: string): Promise<CvHealthCheckResultDto> {
    const profile = await prisma.applicantProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true } },
        applicantSkills: { include: { skill: true } },
        workExperiences: true,
        educations: true,
        certifications: true,
        cvs: true,
      },
    });

    if (!profile) {
      throw new NotFoundError('Applicant profile not found.');
    }

    // Select target CV or fallback to primary/latest
    let targetCv = cvId
      ? profile.cvs.find((c) => c.id === cvId)
      : profile.cvs.find((c) => c.isPrimary) || profile.cvs[0];

    // Assemble text for analysis from CV parsed text or profile fields
    let rawText = targetCv?.parsedText || '';
    if (!rawText || rawText.trim().length < 50) {
      // Fallback to profile assembled text
      const profileParts = [
        profile.summary || '',
        ...profile.workExperiences.map((e) => `${e.title} at ${e.companyName}: ${e.description || ''}`),
        ...profile.educations.map((ed) => `${ed.degree} in ${ed.fieldOfStudy} at ${ed.institution}`),
        ...profile.applicantSkills.map((s) => s.skill.name),
      ];
      rawText = profileParts.filter(Boolean).join('\n');
    }

    const issues: CvHealthIssueDto[] = [];
    let healthScore = 100;

    // 1. Section Completeness Checks
    const hasContactPhone = Boolean(profile.phone && profile.phone.trim().length > 5);
    const hasLocation = Boolean(profile.location && profile.location.trim().length > 2);
    const hasSummary = Boolean(profile.summary && profile.summary.trim().split(/\s+/).length >= 20);
    const hasExperience = profile.workExperiences.length > 0;
    const hasEducation = profile.educations.length > 0;
    const hasSkills = profile.applicantSkills.length >= 3;

    // Contact info
    if (!hasContactPhone || !hasLocation) {
      healthScore -= 10;
      issues.push({
        id: 'missing-contact',
        category: 'COMPLETENESS',
        severity: 'WARNING',
        title: 'Incomplete Contact Details',
        description: `Your profile is missing a ${!hasContactPhone ? 'phone number' : 'location'}.`,
        recommendation: 'Add a valid phone number and location so hiring managers can reach you promptly.',
      });
    } else {
      issues.push({
        id: 'contact-passed',
        category: 'COMPLETENESS',
        severity: 'PASSED',
        title: 'Contact Information Complete',
        description: 'Verified email, phone number, and location are present.',
        recommendation: 'Ensure your phone number has country code for international recruiters.',
      });
    }

    // Summary
    if (!hasSummary) {
      healthScore -= 12;
      issues.push({
        id: 'missing-summary',
        category: 'COMPLETENESS',
        severity: 'CRITICAL',
        title: 'Missing or Brief Professional Summary',
        description: 'A strong executive summary hook grabs recruiter attention within the first 6 seconds.',
        recommendation: 'Write a 3–4 sentence summary highlighting your core expertise, years of impact, and top technologies.',
      });
    } else {
      issues.push({
        id: 'summary-passed',
        category: 'COMPLETENESS',
        severity: 'PASSED',
        title: 'Professional Summary Present',
        description: 'Your summary provides an introductory overview of your experience.',
        recommendation: 'Keep your summary refreshed with your most recent accomplishments.',
      });
    }

    // Experience
    if (!hasExperience) {
      healthScore -= 25;
      issues.push({
        id: 'missing-experience',
        category: 'COMPLETENESS',
        severity: 'CRITICAL',
        title: 'No Work Experience Listed',
        description: 'Work experience is the primary weighting factor in ATS scoring algorithms.',
        recommendation: 'Add your recent employment history, internships, freelance projects, or relevant roles.',
      });
    } else {
      issues.push({
        id: 'experience-passed',
        category: 'COMPLETENESS',
        severity: 'PASSED',
        title: 'Work Experience Listed',
        description: `${profile.workExperiences.length} position(s) documented with titles and employers.`,
        recommendation: 'Focus bullet points on results rather than daily task descriptions.',
      });
    }

    // Education
    if (!hasEducation) {
      healthScore -= 10;
      issues.push({
        id: 'missing-education',
        category: 'COMPLETENESS',
        severity: 'WARNING',
        title: 'No Formal Education Documented',
        description: 'Many corporate vacancies have minimum degree qualifications.',
        recommendation: 'Add your degree, high school, or vocational certification.',
      });
    } else {
      issues.push({
        id: 'education-passed',
        category: 'COMPLETENESS',
        severity: 'PASSED',
        title: 'Education Section Complete',
        description: `${profile.educations.length} academic credential(s) listed.`,
        recommendation: 'Include graduation year or expected graduation date.',
      });
    }

    // Skills
    if (!hasSkills) {
      healthScore -= 15;
      issues.push({
        id: 'missing-skills',
        category: 'COMPLETENESS',
        severity: 'CRITICAL',
        title: 'Too Few Skills Listed',
        description: 'Profiles with fewer than 3 verified skills match poorly in automated keyword indexing.',
        recommendation: 'Add at least 5–10 core technical and domain skills to match job descriptions.',
      });
    } else {
      issues.push({
        id: 'skills-passed',
        category: 'COMPLETENESS',
        severity: 'PASSED',
        title: 'Strong Skills Inventory',
        description: `${profile.applicantSkills.length} skills indexed in profile.`,
        recommendation: 'Periodically organize skills by proficiency level (Expert, Intermediate, Beginner).',
      });
    }

    // 2. Content Quality & Metrics Analysis
    const words = rawText.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const wordCount = words.length;

    if (wordCount < 150) {
      healthScore -= 15;
      issues.push({
        id: 'short-content',
        category: 'CONTENT_QUALITY',
        severity: 'CRITICAL',
        title: 'CV Content is Too Brief',
        description: `Your CV text contains only ${wordCount} words. Standard professional CVs typically contain 400–900 words.`,
        recommendation: 'Expand your work experience descriptions by adding details about specific systems, projects, and accomplishments.',
      });
    } else if (wordCount > 1200) {
      healthScore -= 5;
      issues.push({
        id: 'long-content',
        category: 'CONTENT_QUALITY',
        severity: 'SUGGESTION',
        title: 'Consider Condensing Content',
        description: `Your CV is quite long (${wordCount} words). Recruiters prefer concise 1-2 page resumes.`,
        recommendation: 'Consolidate older positions and trim repetitive descriptions.',
      });
    } else {
      issues.push({
        id: 'length-passed',
        category: 'CONTENT_QUALITY',
        severity: 'PASSED',
        title: 'Optimal Length & Word Count',
        description: `Word count (${wordCount} words) is within the recommended 1–2 page standard.`,
        recommendation: 'Maintain this concise depth for maximum recruiter readability.',
      });
    }

    // 3. Action Verbs
    const foundVerbs = STRONG_ACTION_VERBS.filter((verb) =>
      words.some((w) => w === verb || w.startsWith(verb))
    );
    const actionVerbCount = foundVerbs.length;

    if (actionVerbCount < 3) {
      healthScore -= 8;
      issues.push({
        id: 'weak-verbs',
        category: 'CONTENT_QUALITY',
        severity: 'WARNING',
        title: 'Low Action Verb Density',
        description: 'Using passive language ("responsible for", "assisted with") reduces the perceived impact of your work.',
        recommendation: 'Start bullet points with powerful verbs like "Architected", "Spearheaded", "Optimized", or "Delivered".',
      });
    } else {
      issues.push({
        id: 'verbs-passed',
        category: 'CONTENT_QUALITY',
        severity: 'PASSED',
        title: 'Strong Action Verbs Used',
        description: `Found ${actionVerbCount} distinct action verbs demonstrating leadership and initiative.`,
        recommendation: 'Continue leading each bullet point with past-tense action verbs.',
      });
    }

    // 4. Quantifiable Impact Metrics
    const metricMatches = rawText.match(
      /\b(?:\d+[%kKmMbB]?|\$\d+|\d+x|\d+\s*(?:percent|users|clients|projects|million|thousand))\b/g
    ) || [];
    const quantifiableMetricsCount = metricMatches.length;

    if (quantifiableMetricsCount === 0) {
      healthScore -= 12;
      issues.push({
        id: 'no-metrics',
        category: 'IMPACT_METRICS',
        severity: 'WARNING',
        title: 'No Quantifiable Metrics Detected',
        description: 'Resumes with measurable metrics achieve 40% higher recruiter interview callbacks.',
        recommendation: 'Include numbers, percentages, or scale (e.g. "reduced latency by 45%", "served 100k+ active users", "managed $250k budget").',
      });
    } else {
      issues.push({
        id: 'metrics-passed',
        category: 'IMPACT_METRICS',
        severity: 'PASSED',
        title: 'Measurable Impact Demonstrated',
        description: `Detected ${quantifiableMetricsCount} quantifiable metric(s) illustrating scale and business impact.`,
        recommendation: 'Highlight your highest percentage and financial gains in bold font.',
      });
    }

    // 5. Buzzword check
    const buzzwordsFound = OVERUSED_BUZZWORDS.filter((bz) =>
      rawText.toLowerCase().includes(bz)
    );
    if (buzzwordsFound.length > 0) {
      healthScore -= 5;
      issues.push({
        id: 'buzzwords-flagged',
        category: 'CONTENT_QUALITY',
        severity: 'SUGGESTION',
        title: 'Contains Cliché Buzzwords',
        description: `Detected cliché terms: "${buzzwordsFound.join('", "')}".`,
        recommendation: 'Replace generic buzzwords with concrete examples of your work and technical achievements.',
      });
    }

    // 6. Top Keywords Density
    const freqMap = new Map<string, number>();
    for (const w of words) {
      if (w.length >= 4 && !COMMON_STOP_WORDS.has(w)) {
        freqMap.set(w, (freqMap.get(w) || 0) + 1);
      }
    }

    const sortedKeywords = Array.from(freqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word, count]) => ({
        word,
        count,
        densityPercent: Number(((count / (words.length || 1)) * 100).toFixed(1)),
      }));

    // Bullet points count
    const bulletMatches = rawText.match(/^[•\-\*]\s+/gm) || [];
    const bulletPointsCount = bulletMatches.length;

    // Normalize final score
    const finalScore = Math.max(20, Math.min(100, healthScore));

    let grade: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL' = 'CRITICAL';
    if (finalScore >= 85) grade = 'EXCELLENT';
    else if (finalScore >= 70) grade = 'GOOD';
    else if (finalScore >= 50) grade = 'NEEDS_IMPROVEMENT';

    const criticalIssuesCount = issues.filter((i) => i.severity === 'CRITICAL').length;
    const warningsCount = issues.filter((i) => i.severity === 'WARNING').length;
    const passedChecksCount = issues.filter((i) => i.severity === 'PASSED').length;

    return {
      healthScore: finalScore,
      grade,
      wordCount,
      actionVerbCount,
      quantifiableMetricsCount,
      bulletPointsCount,
      sectionChecks: {
        contactInfo: hasContactPhone && hasLocation,
        summary: hasSummary,
        experience: hasExperience,
        education: hasEducation,
        skills: hasSkills,
      },
      topKeywords: sortedKeywords,
      issues,
      passedChecksCount,
      criticalIssuesCount,
      warningsCount,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Aggregate market demand and generate targeted profile improvements (FR-AP-23)
   */
  async getProfileImprovementSuggestions(userId: string): Promise<ProfileImprovementResponseDto> {
    const profile = await prisma.applicantProfile.findUnique({
      where: { userId },
      include: {
        applicantSkills: { include: { skill: true } },
        workExperiences: true,
        educations: true,
        applications: {
          include: {
            job: {
              include: {
                jobRequiredSkills: { include: { skill: true } },
              },
            },
          },
        },
        savedJobs: {
          include: {
            job: {
              include: {
                jobRequiredSkills: { include: { skill: true } },
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundError('Applicant profile not found.');
    }

    // Combine jobs from applications and saved jobs
    const targetJobsMap = new Map<string, any>();
    profile.applications.forEach((app) => targetJobsMap.set(app.jobId, app.job));
    profile.savedJobs.forEach((s) => targetJobsMap.set(s.jobId, s.job));

    const targetJobs = Array.from(targetJobsMap.values());
    const targetJobsAnalyzedCount = targetJobs.length;

    // Applicant existing skills set
    const candidateSkillNames = new Set(
      profile.applicantSkills.map((s) => s.skill.name.toLowerCase().trim())
    );

    // Count market demand for required skills
    const skillDemandCount = new Map<string, { name: string; count: number }>();

    for (const job of targetJobs) {
      for (const reqSkill of job.jobRequiredSkills || []) {
        const skillName = reqSkill.skill.name;
        const lower = skillName.toLowerCase().trim();
        const existing = skillDemandCount.get(lower) || { name: skillName, count: 0 };
        existing.count += 1;
        skillDemandCount.set(lower, existing);
      }
    }

    // Find missing skills ranked by frequency
    const missingSkillsList: Array<{
      name: string;
      frequency: number;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
    }> = [];

    for (const [lowerName, item] of skillDemandCount.entries()) {
      if (!candidateSkillNames.has(lowerName)) {
        const demandRatio = targetJobsAnalyzedCount > 0 ? item.count / targetJobsAnalyzedCount : 0;
        let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        if (demandRatio >= 0.5 || item.count >= 2) priority = 'HIGH';
        else if (demandRatio >= 0.25 || item.count >= 1) priority = 'MEDIUM';

        missingSkillsList.push({
          name: item.name,
          frequency: item.count,
          priority,
        });
      }
    }

    missingSkillsList.sort((a, b) => b.frequency - a.frequency);

    // Generate actionable suggestions
    const suggestions: ProfileImprovementSuggestionDto[] = [];

    // 1. Skill Gap Suggestions
    missingSkillsList.slice(0, 3).forEach((skill, idx) => {
      suggestions.push({
        id: `skill-gap-${idx}`,
        category: 'SKILL_GAP',
        priority: skill.priority,
        title: `Add "${skill.name}" to your profile skills`,
        description: `"${skill.name}" appears in ${skill.frequency} of your target jobs (${
          targetJobsAnalyzedCount > 0
            ? Math.round((skill.frequency / targetJobsAnalyzedCount) * 100)
            : 100
        }% demand). Adding your proficiency and experience will boost your ATS match score.`,
        marketDemandPercent:
          targetJobsAnalyzedCount > 0
            ? Math.round((skill.frequency / targetJobsAnalyzedCount) * 100)
            : undefined,
        actionLabel: `Add ${skill.name}`,
        actionType: 'ADD_SKILL',
        metadata: { skillName: skill.name },
      });
    });

    // 2. Headline & Summary Optimization
    if (!profile.headline || profile.headline.trim().length < 5) {
      suggestions.push({
        id: 'headline-opt',
        category: 'HEADLINE_OPTIMIZATION',
        priority: 'HIGH',
        title: 'Define a focused professional headline',
        description: 'A crisp, role-targeted headline (e.g. "Senior Full-Stack Engineer | React, Node.js, AWS") improves recruiter search indexing.',
        actionLabel: 'Update Headline',
        actionType: 'EDIT_SUMMARY',
      });
    }

    if (!profile.summary || profile.summary.trim().split(/\s+/).length < 25) {
      suggestions.push({
        id: 'summary-opt',
        category: 'HEADLINE_OPTIMIZATION',
        priority: 'MEDIUM',
        title: 'Expand your professional summary',
        description: 'Provide an engaging 3–4 sentence overview highlighting your career accomplishments, tech stack, and leadership impact.',
        actionLabel: 'Edit Summary',
        actionType: 'EDIT_SUMMARY',
      });
    }

    // 3. Experience Impact Suggestion
    const experiencesWithoutMetrics = profile.workExperiences.filter(
      (exp) =>
        !exp.description ||
        !exp.description.match(
          /\b(?:\d+[%kKmMbB]?|\$\d+|\d+x|\d+\s*(?:percent|users|clients|projects))\b/
        )
    );

    if (experiencesWithoutMetrics.length > 0) {
      suggestions.push({
        id: 'exp-metrics-opt',
        category: 'EXPERIENCE_CLARITY',
        priority: 'MEDIUM',
        title: 'Add quantifiable results to work experience',
        description: `${experiencesWithoutMetrics.length} role(s) lack numerical business outcomes. Quantifying achievements (e.g., "reduced build time by 40%") significantly increases recruiter interview rates.`,
        actionLabel: 'Enhance Experience',
        actionType: 'ADD_EXPERIENCE',
      });
    }

    // Calculate Overall Readiness Score (0–100)
    let readinessScore = 50;
    if (profile.headline) readinessScore += 10;
    if (profile.summary && profile.summary.length > 50) readinessScore += 10;
    if (profile.applicantSkills.length >= 5) readinessScore += 15;
    if (profile.workExperiences.length >= 1) readinessScore += 15;

    // Bonus for closing top skill gaps
    const totalRequiredAcrossJobs = skillDemandCount.size || 1;
    const candidateMatchedCount = totalRequiredAcrossJobs - missingSkillsList.length;
    const matchRatio = Math.max(0, candidateMatchedCount / totalRequiredAcrossJobs);
    readinessScore = Math.round(readinessScore * 0.7 + matchRatio * 30);
    readinessScore = Math.min(100, Math.max(20, readinessScore));

    return {
      overallReadinessScore: readinessScore,
      targetJobsAnalyzedCount,
      topMissingSkills: missingSkillsList.slice(0, 5),
      suggestions,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const careerToolsService = new CareerToolsService();
