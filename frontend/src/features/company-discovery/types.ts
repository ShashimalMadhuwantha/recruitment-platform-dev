export type {
  PublicCompanyOfficeLocation,
  PublicCompanyCultureMedia,
  PublicCompanySocialLinks,
  PublicCompanySummaryDto,
  PublicCompanyDetailDto,
  PublicCompanyJobItemDto,
  PublicCompanyJobsResponseDto,
  ToggleCompanyFollowResponseDto,
  CompanyDiscoveryQueryDto,
} from '@recruitment-platform/shared';

export interface CompanyDiscoveryFilterState {
  keyword: string;
  industry: string;
  location: string;
  size: string;
  hasActiveJobs: boolean;
  sortBy: 'name' | 'activeJobs' | 'followers' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
