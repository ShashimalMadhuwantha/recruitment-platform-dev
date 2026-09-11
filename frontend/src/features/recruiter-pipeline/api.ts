import { apiClient } from '../../lib/api-client';
import type {
  PipelineCandidateDto,
  CandidateNoteDto,
  CreateCandidateNoteDto,
  MoveCandidateStageDto,
  BulkMoveCandidateStageDto,
  CandidateComparisonResponseDto,
  TalentPoolCandidateDto,
  TalentPoolSearchParams,
} from './types';

export const recruiterPipelineApi = {
  /**
   * FR-RC-10: Fetch job applications with filtering, sorting, and score bands
   */
  getJobApplications: async (
    jobId: string,
    params?: {
      search?: string;
      status?: string;
      scoreBand?: string;
      sortBy?: string;
      sortOrder?: string;
    }
  ): Promise<PipelineCandidateDto[]> => {
    const res = await apiClient.get<{ data: PipelineCandidateDto[] }>(
      `/v1/applications/jobs/${jobId}`,
      { params }
    );
    return res.data.data;
  },

  /**
   * FR-RC-12: Move a single candidate stage with notes & audit logging
   */
  moveCandidateStage: async (
    applicationId: string,
    dto: MoveCandidateStageDto
  ): Promise<{ success: boolean; status: string; stageName: string }> => {
    const res = await apiClient.patch<{
      data: { success: boolean; status: string; stageName: string };
    }>(`/v1/applications/${applicationId}/stage`, dto);
    return res.data.data;
  },

  /**
   * FR-RC-14: Bulk move candidates stage
   */
  bulkMoveCandidates: async (
    dto: BulkMoveCandidateStageDto
  ): Promise<{ success: boolean; updatedCount: number; stage: string; message: string }> => {
    const res = await apiClient.post<{
      data: { success: boolean; updatedCount: number; stage: string; message: string };
    }>('/v1/applications/bulk-stage', dto);
    return res.data.data;
  },

  /**
   * FR-RC-15: Add internal team candidate note and star rating
   */
  addCandidateNote: async (
    applicationId: string,
    dto: CreateCandidateNoteDto
  ): Promise<CandidateNoteDto> => {
    const res = await apiClient.post<{ data: CandidateNoteDto }>(
      `/v1/applications/${applicationId}/notes`,
      dto
    );
    return res.data.data;
  },

  /**
   * FR-RC-15: Fetch all internal notes for a candidate
   */
  getCandidateNotes: async (applicationId: string): Promise<CandidateNoteDto[]> => {
    const res = await apiClient.get<{ data: CandidateNoteDto[] }>(
      `/v1/applications/${applicationId}/notes`
    );
    return res.data.data;
  },

  /**
   * FR-RC-15: Delete internal candidate note
   */
  deleteCandidateNote: async (
    noteId: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ data: { success: boolean; message: string } }>(
      `/v1/applications/notes/${noteId}`
    );
    return res.data.data;
  },

  /**
   * FR-RC-16: Side-by-side comparison for 2 to 4 candidates
   */
  compareCandidates: async (
    applicationIds: string[]
  ): Promise<CandidateComparisonResponseDto> => {
    const res = await apiClient.post<{ data: CandidateComparisonResponseDto }>(
      '/v1/applications/compare',
      { applicationIds }
    );
    return res.data.data;
  },

  /**
   * FR-RC-11: Talent pool sourcing search
   */
  searchTalentPool: async (
    params: TalentPoolSearchParams
  ): Promise<{
    candidates: TalentPoolCandidateDto[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const res = await apiClient.get<{
      data: {
        candidates: TalentPoolCandidateDto[];
        total: number;
        page: number;
        totalPages: number;
      };
    }>('/v1/talent-pool', { params });
    return res.data.data;
  },
};
