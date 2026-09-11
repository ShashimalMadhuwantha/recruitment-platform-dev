import { apiClient } from '../../lib/api-client';
import type {
  ApplicantProfileDto,
  UpdateApplicantProfileDto,
  WorkExperienceDto,
  EducationDto,
  ApplicantSkillDto,
  CertificationDto,
  PortfolioDto,
  CVDto,
  CVVersionDto,
  CVBuilderRequestDto,
  SelectiveSyncDto,
  AnonymizedProfileDto,
  SkillMaster,
} from './types';

export const applicantProfileApi = {
  // Core Profile
  getProfile: async (): Promise<ApplicantProfileDto> => {
    const res = await apiClient.get<{ data: ApplicantProfileDto }>('/v1/applicant/profile');
    return res.data.data;
  },

  updateProfile: async (data: UpdateApplicantProfileDto): Promise<ApplicantProfileDto> => {
    const res = await apiClient.put<{ data: ApplicantProfileDto }>('/v1/applicant/profile', data);
    return res.data.data;
  },

  // Experience
  addExperience: async (data: Omit<WorkExperienceDto, 'id' | 'applicantId' | 'createdAt'>): Promise<WorkExperienceDto> => {
    const res = await apiClient.post<{ data: WorkExperienceDto }>('/v1/applicant/profile/experience', data);
    return res.data.data;
  },

  updateExperience: async (id: string, data: Partial<WorkExperienceDto>): Promise<WorkExperienceDto> => {
    const res = await apiClient.put<{ data: WorkExperienceDto }>(`/v1/applicant/profile/experience/${id}`, data);
    return res.data.data;
  },

  deleteExperience: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ data: { success: boolean } }>(`/v1/applicant/profile/experience/${id}`);
    return res.data.data;
  },

  // Education
  addEducation: async (data: Omit<EducationDto, 'id' | 'applicantId' | 'createdAt'>): Promise<EducationDto> => {
    const res = await apiClient.post<{ data: EducationDto }>('/v1/applicant/profile/education', data);
    return res.data.data;
  },

  updateEducation: async (id: string, data: Partial<EducationDto>): Promise<EducationDto> => {
    const res = await apiClient.put<{ data: EducationDto }>(`/v1/applicant/profile/education/${id}`, data);
    return res.data.data;
  },

  deleteEducation: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ data: { success: boolean } }>(`/v1/applicant/profile/education/${id}`);
    return res.data.data;
  },

  // Skills
  addSkill: async (data: { skillId: string; proficiency: number; yearsExperience?: number | null }): Promise<ApplicantSkillDto> => {
    const res = await apiClient.post<{ data: ApplicantSkillDto }>('/v1/applicant/profile/skills', data);
    return res.data.data;
  },

  updateSkill: async (id: string, data: { proficiency?: number; yearsExperience?: number | null }): Promise<ApplicantSkillDto> => {
    const res = await apiClient.put<{ data: ApplicantSkillDto }>(`/v1/applicant/profile/skills/${id}`, data);
    return res.data.data;
  },

  deleteSkill: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ data: { success: boolean } }>(`/v1/applicant/profile/skills/${id}`);
    return res.data.data;
  },

  // Certifications
  addCertification: async (data: Omit<CertificationDto, 'id' | 'applicantId' | 'createdAt'>): Promise<CertificationDto> => {
    const res = await apiClient.post<{ data: CertificationDto }>('/v1/applicant/profile/certifications', data);
    return res.data.data;
  },

  deleteCertification: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ data: { success: boolean } }>(`/v1/applicant/profile/certifications/${id}`);
    return res.data.data;
  },

  // Portfolios
  addPortfolio: async (data: { type: string; url: string; fileRef?: string | null }): Promise<PortfolioDto> => {
    const res = await apiClient.post<{ data: PortfolioDto }>('/v1/applicant/profile/portfolio', data);
    return res.data.data;
  },

  deletePortfolio: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ data: { success: boolean } }>(`/v1/applicant/profile/portfolio/${id}`);
    return res.data.data;
  },

  // Resumes / CVs
  listResumes: async (): Promise<CVDto[]> => {
    const res = await apiClient.get<{ data: CVDto[] }>('/v1/applicant/resume');
    return res.data.data;
  },

  uploadResume: async (data: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileData?: string;
    versionLabel?: string;
    isPrimary?: boolean;
    formData?: FormData;
  }): Promise<CVDto> => {
    if (data.formData) {
      const res = await apiClient.post<{ data: CVDto }>('/v1/applicant/resume', data.formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    }

    const res = await apiClient.post<{ data: CVDto }>('/v1/applicant/resume', {
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      fileData: data.fileData,
      versionLabel: data.versionLabel,
      isPrimary: data.isPrimary,
    });
    return res.data.data;
  },

  deleteResume: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ data: { success: boolean } }>(`/v1/applicant/resume/${id}`);
    return res.data.data;
  },

  setPrimaryResume: async (id: string): Promise<CVDto> => {
    const res = await apiClient.put<{ data: CVDto }>(`/v1/applicant/resume/${id}/primary`);
    return res.data.data;
  },

  applyResumeToProfile: async (cvId: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<{ data: { success: boolean; message: string } }>(
      `/v1/applicant/resume/${cvId}/apply-to-profile`
    );
    return res.data.data;
  },

  // Epic 9: Builder, Versions & Selective Sync
  buildResume: async (data: CVBuilderRequestDto): Promise<CVDto> => {
    const res = await apiClient.post<{ data: CVDto }>('/v1/applicant/resume/build', data);
    return res.data.data;
  },

  getCVVersions: async (cvId: string): Promise<CVVersionDto[]> => {
    const res = await apiClient.get<{ data: CVVersionDto[] }>(`/v1/applicant/resume/${cvId}/versions`);
    return res.data.data;
  },

  restoreCVVersion: async (cvId: string, versionId: string): Promise<CVDto> => {
    const res = await apiClient.post<{ data: CVDto }>(
      `/v1/applicant/resume/${cvId}/versions/${versionId}/restore`
    );
    return res.data.data;
  },

  updateCVLabel: async (cvId: string, versionLabel: string): Promise<CVDto> => {
    const res = await apiClient.put<{ data: CVDto }>(`/v1/applicant/resume/${cvId}/label`, { versionLabel });
    return res.data.data;
  },

  duplicateCV: async (cvId: string): Promise<CVDto> => {
    const res = await apiClient.post<{ data: CVDto }>(`/v1/applicant/resume/${cvId}/duplicate`);
    return res.data.data;
  },

  syncResumeSelective: async (
    cvId: string,
    data: SelectiveSyncDto
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<{ data: { success: boolean; message: string } }>(
      `/v1/applicant/resume/${cvId}/sync-selective`,
      data
    );
    return res.data.data;
  },

  downloadResumeBlob: async (cvId: string, fallbackFileName?: string): Promise<void> => {
    const res = await apiClient.get(`/v1/applicant/resume/${cvId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fallbackFileName || 'Resume.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Blind Recruitment Anonymized Preview
  getAnonymizedPreview: async (): Promise<AnonymizedProfileDto> => {
    const res = await apiClient.get<{ data: AnonymizedProfileDto }>('/v1/applicant/profile/anonymized-preview');
    return res.data.data;
  },

  // Master Taxonomy Skills
  getTaxonomySkills: async (): Promise<SkillMaster[]> => {
    const res = await apiClient.get<{ data: SkillMaster[] }>('/v1/taxonomy/skills');
    return res.data.data;
  },
};
