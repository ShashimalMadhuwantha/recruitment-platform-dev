# Epic 7: ATS Scoring Engine

## Overview
Epic 7 implements the multi-dimensional, deterministic Applicant Tracking System (ATS) Scoring Engine in accordance with `docs/Recruitment_Platform_SRS.md` (§4, §5.1, §6) and `docs/Epic_Backlog.md`. It provides candidates with on-demand pre-apply match predictions and improvement recommendations, scores incoming applications deterministically across 5 sub-score dimensions using in-process natural language vectorization (`natural` TF-IDF cosine similarity) with strict anti-bias demographic exclusions (`FR-ATS-09`), allows recruiters to review rich dimension breakdowns and override scores with mandatory compliance justification (`FR-ATS-06`, `FR-ATS-10`), and supports batch re-scoring when job requirements change (`FR-ATS-08`).

---

## 1. Features Implemented

### 1.1 Multi-Dimensional ATS Scoring Core (`feature/07-ats-engine-core`)
- **Skills Match Sub-score (Default 40% Weight)**:
  - Evaluates weighted overlap between candidate taxonomy skills and job requirements.
  - Distinguishes between `MUST_HAVE` (weight multiplier = 2.0) and `NICE_TO_HAVE` (weight multiplier = 1.0).
  - Scales individual skill scores by candidate proficiency ratio: $\min(1.0, \text{applicantProficiency} / \text{requiredProficiency})$, penalizing under-qualified skills proportionally.
- **Experience Match Sub-score (Default 25% Weight)**:
  - Combines experience duration alignment (70% weight) with role/title relevance (30% weight).
  - Duration scoring: Linear interpolation up to required years ($E_{\text{applicant}} / E_{\text{required}}$ capped at 1.0; 1.0 if no requirement).
  - Title relevance: Token overlap similarity between past job titles and vacancy title.
- **Education Match Sub-score (Default 15% Weight)**:
  - Degree hierarchy rank mapping:
    - Doctorate = 5
    - Master = 4
    - Bachelor = 3
    - Associate / Diploma = 2
    - High School / Secondary = 1
    - None = 0
  - Scores 1.0 if applicant level $\ge$ required level; applies penalty for level deficit.
  - Field-of-study bonus for technical alignment (Computer Science, Engineering, Information Technology, Data Science, etc.).
- **TF-IDF Semantic Match Sub-score (Default 15% Weight)**:
  - In-process Natural Language Processing using the `natural` library (`TfIdf` vectorizer).
  - Cosine similarity between parsed candidate CV plain text and vacancy job description text.
  - Zero external cloud AI or vector database dependencies, fully compliant with SRS §2.2 and §4.6.
  - Extracts top 8 matching technical terms to enrich score explainability.
- **Certifications Match Sub-score (Default 5% Weight)**:
  - Compares candidate credentials against job certification requirements via exact and substring matching.
  - Defaults to full score (1.0) when vacancies specify no certification prerequisites.
- **Anti-Bias Demographic Exclusion Safeguard (`FR-ATS-09`)**:
  - Automatically sanitizes CV text and profile fields before running the semantic vectorizer.
  - Strips demographic identifiers: age, date of birth, gender pronouns (he/him, she/her, they/them), marital status, nationality, and physical attributes to eliminate demographic bias.
- **Explainability & Actionable Recommendations**:
  - Maps overall scores to standardized score bands:
    - **HIGH** ($\ge 80\%$, "Strong match")
    - **MID** ($60\% - 79\%$, "Partial match")
    - **LOW** ($< 60\%$, "Weak match")
  - Generates clear, candidate-facing feedback: missing must-have skills, missing nice-to-have skills, experience gap warnings, and suggested CV keywords.

### 1.2 Scoring Triggers, Pre-Apply Preview & Recruiter Calibration (`feature/07-ats-scoring-triggers`)
- **Candidate Pre-Apply Match Preview (`FR-ATS-02`)**:
  - Real-time preview endpoint (`GET /api/v1/ats/jobs/:jobId/match-preview`) calculating instant ATS match score and gap analysis before application submission.
- **Application Scoring Lifecycle (`FR-ATS-01`)**:
  - Persistent scoring endpoint (`POST /api/v1/ats/applications/:applicationId/score`) saving deterministic `ATSScore` record linked to application.
- **Recruiter Manual Score Override & Calibration (`FR-ATS-06`, `FR-ATS-10`)**:
  - Override endpoint (`POST /api/v1/ats/applications/:applicationId/override`) allowing authorized recruiters to adjust candidate scores (0–100).
  - Mandatory justification reason (min 5 characters) enforced by server-side validation.
  - Immutable audit trail recorded in `AuditLog` (`action: 'OVERRIDE_ATS_SCORE'`) with previous score, new score, recruiter ID, and timestamp.
- **Batch Re-scoring (`FR-ATS-08`)**:
  - Vacancy-level re-computation (`POST /api/v1/ats/jobs/:jobId/rescore`) automatically recalculating scores across all active applications when job requirements change.

### 1.3 ATS Score UI & Interactive Visualization (`feature/07-ats-score-ui`)
- **`PreApplyMatchPreviewDrawer`**:
  - Slide-over drawer on job details page showing candidate's predicted match strength.
  - Displays missing critical skills with warning chips, matched skills with checkmarks, dimension breakdown meters, and a direct "Proceed to Apply" CTA.
- **`CandidateScoreAnalysisModal`**:
  - Rich modal for recruiters inspecting candidate applications.
  - Displays effective score with score band, active override alert banner, detailed sub-score evidence boxes, and interactive score calibration form with audit disclosure.
- **`ScoreBreakdown` Shared Component**:
  - Multi-dimensional progress meters for all 5 sub-scores with percentage weights.
  - Highlights manual overrides with recruiter justification when active.
  - Renders top matching semantic keywords as tag chips.

---

## 2. API Endpoints Reference

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/v1/ats/preview` | In-memory algorithm preview & validation endpoint | Public / Any |
| `GET` | `/api/v1/ats/jobs/:jobId/match-preview` | Candidate on-demand pre-apply match preview & advice | Applicant, Super Admin |
| `GET` | `/api/v1/ats/applications/:applicationId/score` | Retrieve full ATS score details for an application | Recruiter, Super Admin, Applicant (own) |
| `POST` | `/api/v1/ats/applications/:applicationId/score` | Trigger deterministic scoring or re-scoring for an application | Recruiter, Super Admin |
| `POST` | `/api/v1/ats/applications/:applicationId/override` | Recruiter manual score override with mandatory justification | Recruiter, Super Admin |
| `POST` | `/api/v1/ats/jobs/:jobId/rescore` | Batch re-score all applications for a vacancy | Recruiter, Super Admin |

---

## 3. Mathematical Models & Weight System

### 3.1 Weighted Aggregate Formula
$$\text{OverallScore} = \text{round}\left(100 \times \sum_{i=1}^{5} \left( w_i \times s_i \right)\right)$$

Where $s_i \in [0, 1]$ represents each normalized sub-score and $w_i \in [0, 1]$ represents the normalized weight such that $\sum w_i = 1.0$.

### 3.2 Default Weights Matrix
| Dimension | Weight ($w_i$) | Normalization Rules |
|---|---|---|
| Skills Match | 40% (0.40) | $\sum (\text{weight} \times \text{proficiencyFactor}) / \sum \text{weight}$ |
| Experience Match | 25% (0.25) | $0.70 \times \min(1.0, \frac{E_{\text{cand}}}{E_{\text{req}}}) + 0.30 \times \text{TitleRelevance}$ |
| Education Match | 15% (0.15) | $\text{RankDeficitPenalty} + \text{FieldBonus}$ |
| Semantic Similarity | 15% (0.15) | Cosine similarity: $\frac{\vec{V}_{\text{CV}} \cdot \vec{V}_{\text{JD}}}{\|\vec{V}_{\text{CV}}\| \|\vec{V}_{\text{JD}}\|}$ |
| Certifications Match | 5% (0.05) | $\text{MatchedCerts} / \text{RequiredCerts}$ (1.0 if none required) |

Vacancies can selectively override these weights via `JobVacancy.atsWeightPreset` or custom `atsCustomWeightsJson`.

---

## 4. Frontend Components & Design System Integration

1. **`PreApplyMatchPreviewDrawer.tsx`**:
   - Location: `frontend/src/features/ats-scoring/components/PreApplyMatchPreviewDrawer.tsx`
   - Slide-over drawer with backdrop blur, match percentage header, recommendation cards, missing must-have chips (`bg-danger/10 text-danger`), and matched chips (`bg-success/10 text-success`).
2. **`CandidateScoreAnalysisModal.tsx`**:
   - Location: `frontend/src/features/ats-scoring/components/CandidateScoreAnalysisModal.tsx`
   - Recruiter evaluation modal with score calibration form (`Adjusted Score`, `Mandatory Justification Reason`), active override banner (`bg-warning/10 text-warning`), and sub-score evidence breakdowns.
3. **`ScoreBreakdown.tsx`**:
   - Location: `frontend/src/components/shared/ScoreBreakdown.tsx`
   - Reusable card rendering all 5 evaluation dimensions, percentage meters, matched items counts, override banners, and semantic keyword tags.
4. **`ScoreBadge.tsx`**:
   - Location: `frontend/src/components/ui/ScoreBadge.tsx`
   - Standardized token-driven score badge with color-coded bands: `score-high` (green, $\ge 80$), `score-mid` (amber, $60-79$), `score-low` (rose, $<60$).

---

## 5. Automated Testing & Verification Metrics

### Backend Tests
- Command: `npm run test:backend`
- Test Suite: `src/modules/ats-scoring/ats-scoring.test.ts`
- Metrics: **13 / 13 tests passed** (Total Backend Suite: **73 / 73 tests passed** across 8 test suites)
- Test Coverage:
  - Pure algorithmic sub-score calculation for all 5 dimensions.
  - Anti-bias text sanitizer removing gender pronouns, age, DOB, and nationality markers.
  - Explainability recommendations and band classification.
  - Application scoring and database persistence.
  - Recruiter score override validation and `AuditLog` creation.
  - Vacancy batch re-scoring.

### Frontend Tests
- Command: `npm run test --workspace=frontend`
- Test Suite: `tests/unit/AtsScoringFlow.test.tsx`
- Metrics: **9 / 9 tests passed** (Total Frontend Suite: **50 / 50 tests passed** across 8 test suites)
- Test Coverage:
  - `ScoreBreakdown` component rendering across all 5 dimensions with percentage weights.
  - `ScoreBreakdown` active manual override banner rendering.
  - `PreApplyMatchPreviewDrawer` open/closed states, predicted match, missing skills warnings, and CTA triggers.
  - `CandidateScoreAnalysisModal` dimension evidence, override form submission, and active calibration alerts.

### Monorepo Validation
- `npm run typecheck`: **0 errors** across `shared`, `backend`, and `frontend`.
- `npm run build`: **Successful production build** across all 3 workspaces.
