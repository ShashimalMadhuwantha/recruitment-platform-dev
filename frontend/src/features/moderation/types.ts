import {
  ContentReport,
  ReportTargetType,
  ReportStatus,
  BannedKeyword,
  BannedKeywordCategory,
  GdprRequest,
  GdprRequestType,
  GdprRequestStatus,
  ModerationStats,
  AuditLogEntry,
  PaginatedResult,
} from '@recruitment-platform/shared';

export type {
  ContentReport,
  ReportTargetType,
  ReportStatus,
  BannedKeyword,
  BannedKeywordCategory,
  GdprRequest,
  GdprRequestType,
  GdprRequestStatus,
  ModerationStats,
  AuditLogEntry,
  PaginatedResult,
};

export interface ReportFilterParams {
  page?: number;
  limit?: number;
  targetType?: ReportTargetType;
  status?: ReportStatus;
  search?: string;
}

export interface ResolveReportPayload {
  action: 'RESTORE' | 'TAKEDOWN' | 'FORCE_EDIT' | 'WARN_USER' | 'SUSPEND_PROFILE' | 'DISMISS';
  notes: string;
}

export interface CreateBannedKeywordPayload {
  keyword: string;
  category: BannedKeywordCategory;
  severity: 'BLOCK' | 'WARN';
}

export interface AuditLogFilterParams {
  page?: number;
  limit?: number;
  action?: string;
  actorId?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ProcessGdprPayload {
  status: 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  rejectionReason?: string;
}
