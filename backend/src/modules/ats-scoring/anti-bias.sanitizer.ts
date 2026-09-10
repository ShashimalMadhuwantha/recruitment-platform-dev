/**
 * Anti-Bias Demographic Signal Sanitizer (FR-ATS-09)
 *
 * Excludes protected-class signals (age, gender, marital status, nationality,
 * personal pronouns) from CV and profile text prior to semantic vectorization
 * and scoring to ensure fair, unbiased, and compliant candidate evaluation.
 */
export class AntiBiasSanitizer {
  private static readonly PROTECTED_TERMS_REGEX = [
    // Gender pronouns & honorifics
    /\b(he|she|him|her|his|hers|himself|herself)\b/gi,
    /\b(mr|mrs|ms|miss|sir|madam)\b\.?/gi,
    /\b(male|female|non-binary|gender)\b/gi,

    // Age & Birth indicators
    /\b(born\s+(?:in\s+)?\d{4})\b/gi,
    /\b(dob|date\s+of\s+birth)[:\s]+\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b/gi,
    /\b(\d{1,2}\s+(?:years?\s+old|yrs?\s+old))\b/gi,
    /\b(age[:\s]+\d{1,2})\b/gi,

    // Marital & family status
    /\b(married|single|divorced|widowed|marital\s+status|dependents?|children)\b/gi,

    // Nationality & religion references
    /\b(nationality|citizenship|religion|caste|ethnicity)[:\s]+[^\s,.]+/gi,

    // Physical attributes
    /\b(photo|photograph|headshot|height|weight)\b/gi,
  ];

  /**
   * Sanitizes text by stripping protected-class demographic signals
   */
  static sanitizeText(text?: string | null): string {
    if (!text) return '';

    let sanitized = text;
    for (const pattern of this.PROTECTED_TERMS_REGEX) {
      sanitized = sanitized.replace(pattern, ' ');
    }

    // Collapse multiple whitespaces
    return sanitized.replace(/\s+/g, ' ').trim();
  }
}
