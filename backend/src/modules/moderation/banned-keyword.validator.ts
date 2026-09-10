import { prisma } from '../../db/client';

export interface KeywordViolation {
  keyword: string;
  category: string;
  severity: string;
}

export interface KeywordValidationResult {
  isValid: boolean;
  hasBlockingViolations: boolean;
  violations: KeywordViolation[];
}

export class BannedKeywordValidator {
  /**
   * Scans text against active banned keywords and returns any matching violations
   */
  static async validateText(text: string): Promise<KeywordValidationResult> {
    if (!text || text.trim() === '') {
      return { isValid: true, hasBlockingViolations: false, violations: [] };
    }

    const activeKeywords = await prisma.bannedKeyword.findMany({
      where: { isActive: true },
    });

    const normalizedText = text.toLowerCase();
    const violations: KeywordViolation[] = [];

    for (const item of activeKeywords) {
      const pattern = new RegExp(`\\b${item.keyword.toLowerCase()}\\b`, 'i');
      if (pattern.test(normalizedText) || normalizedText.includes(item.keyword.toLowerCase())) {
        violations.push({
          keyword: item.keyword,
          category: item.category,
          severity: item.severity,
        });
      }
    }

    const hasBlockingViolations = violations.some((v) => v.severity === 'BLOCK');

    return {
      isValid: violations.length === 0,
      hasBlockingViolations,
      violations,
    };
  }
}
