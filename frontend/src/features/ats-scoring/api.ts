import { apiClient } from '../../lib/api-client';
import type {
  PreApplyMatchPreviewDto,
  OverrideAtsScoreDto,
  AtsScoreDetailDto,
  BatchRescoreResultDto,
  AtsScoreBreakdown,
} from './types';

export const atsScoringApi = {
  /**
   * On-demand candidate pre-apply match preview (FR-ATS-02)
   */
  getPreApplyMatchPreview: async (jobId: string): Promise<PreApplyMatchPreviewDto> => {
    const res = await apiClient.get<{ data: PreApplyMatchPreviewDto }>(
      `/v1/ats/jobs/${jobId}/match-preview`
    );
    return res.data.data;
  },

  /**
   * Fetch full ATS Score Detail for an application
   */
  getApplicationAtsScore: async (applicationId: string): Promise<AtsScoreDetailDto> => {
    const res = await apiClient.get<{ data: AtsScoreDetailDto }>(
      `/v1/ats/applications/${applicationId}/score`
    );
    return res.data.data;
  },

  /**
   * Trigger on-demand re-score of an application
   */
  recomputeApplicationScore: async (applicationId: string): Promise<AtsScoreBreakdown> => {
    const res = await apiClient.post<{ data: AtsScoreBreakdown }>(
      `/v1/ats/applications/${applicationId}/score`
    );
    return res.data.data;
  },

  /**
   * Recruiter manual score override with mandatory reason (FR-ATS-06, FR-ATS-10)
   */
  overrideAtsScore: async (
    applicationId: string,
    data: OverrideAtsScoreDto
  ): Promise<AtsScoreDetailDto> => {
    const res = await apiClient.post<{ data: AtsScoreDetailDto }>(
      `/v1/ats/applications/${applicationId}/override`,
      data
    );
    return res.data.data;
  },

  /**
   * Batch re-score all applications for a job vacancy (FR-ATS-08)
   */
  batchRescoreJob: async (jobId: string): Promise<BatchRescoreResultDto> => {
    const res = await apiClient.post<{ data: BatchRescoreResultDto }>(
      `/v1/ats/jobs/${jobId}/rescore`
    );
    return res.data.data;
  },

  /**
   * Pure in-memory preview calculation
   */
  previewScore: async (payload: { applicant: any; job: any }): Promise<AtsScoreBreakdown> => {
    const res = await apiClient.post<{ data: AtsScoreBreakdown }>('/v1/ats/preview', payload);
    return res.data.data;
  },
};
