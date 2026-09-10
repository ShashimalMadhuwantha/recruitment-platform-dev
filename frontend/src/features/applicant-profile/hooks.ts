import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicantProfileApi } from './api';
import type {
  UpdateApplicantProfileDto,
  WorkExperienceDto,
  EducationDto,
  CertificationDto,
  PortfolioDto,
} from './types';

export const useApplicantProfile = () => {
  return useQuery({
    queryKey: ['applicant-profile'],
    queryFn: () => applicantProfileApi.getProfile(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateApplicantProfileDto) => applicantProfileApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['anonymized-preview'] });
    },
  });
};

// Experience
export const useAddExperience = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WorkExperienceDto, 'id' | 'applicantId' | 'createdAt'>) =>
      applicantProfileApi.addExperience(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['anonymized-preview'] });
    },
  });
};

export const useUpdateExperience = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkExperienceDto> }) =>
      applicantProfileApi.updateExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['anonymized-preview'] });
    },
  });
};

export const useDeleteExperience = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicantProfileApi.deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['anonymized-preview'] });
    },
  });
};

// Education
export const useAddEducation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<EducationDto, 'id' | 'applicantId' | 'createdAt'>) =>
      applicantProfileApi.addEducation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['anonymized-preview'] });
    },
  });
};

export const useUpdateEducation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EducationDto> }) =>
      applicantProfileApi.updateEducation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['anonymized-preview'] });
    },
  });
};

export const useDeleteEducation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicantProfileApi.deleteEducation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['anonymized-preview'] });
    },
  });
};

// Skills
export const useAddSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { skillId: string; proficiency: number; yearsExperience?: number | null }) =>
      applicantProfileApi.addSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['anonymized-preview'] });
    },
  });
};

export const useUpdateSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { proficiency?: number; yearsExperience?: number | null } }) =>
      applicantProfileApi.updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['anonymized-preview'] });
    },
  });
};

export const useDeleteSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicantProfileApi.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['anonymized-preview'] });
    },
  });
};

// Certifications
export const useAddCertification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CertificationDto, 'id' | 'applicantId' | 'createdAt'>) =>
      applicantProfileApi.addCertification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
    },
  });
};

export const useDeleteCertification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicantProfileApi.deleteCertification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
    },
  });
};

// Portfolios
export const useAddPortfolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; url: string; fileRef?: string | null }) =>
      applicantProfileApi.addPortfolio(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
    },
  });
};

export const useDeletePortfolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicantProfileApi.deletePortfolio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
    },
  });
};

// Resumes / CVs
export const useResumes = () => {
  return useQuery({
    queryKey: ['applicant-resumes'],
    queryFn: () => applicantProfileApi.listResumes(),
  });
};

export const useUploadResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      fileName: string;
      fileSize: number;
      mimeType: string;
      fileData?: string;
      versionLabel?: string;
      isPrimary?: boolean;
      formData?: FormData;
    }) => applicantProfileApi.uploadResume(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-resumes'] });
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
    },
  });
};

export const useDeleteResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicantProfileApi.deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-resumes'] });
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
    },
  });
};

export const useSetPrimaryResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicantProfileApi.setPrimaryResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-resumes'] });
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
    },
  });
};

export const useApplyResumeToProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cvId: string) => applicantProfileApi.applyResumeToProfile(cvId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['anonymized-preview'] });
    },
  });
};

// Blind Recruitment Preview
export const useAnonymizedPreview = () => {
  return useQuery({
    queryKey: ['anonymized-preview'],
    queryFn: () => applicantProfileApi.getAnonymizedPreview(),
  });
};

// Taxonomy Skills
export const useTaxonomySkills = () => {
  return useQuery({
    queryKey: ['taxonomy-skills'],
    queryFn: () => applicantProfileApi.getTaxonomySkills(),
  });
};
