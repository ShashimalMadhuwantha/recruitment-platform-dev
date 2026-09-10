import { describe, it, expect } from 'vitest';
import { AtsScoringService } from './ats-scoring.service';
import { calculateSkillsMatch } from './sub-scores/skills-match';
import { calculateExperienceMatch } from './sub-scores/experience-match';
import { calculateEducationMatch } from './sub-scores/education-match';
import { calculateSemanticMatch } from './sub-scores/semantic-match';
import { calculateCertificationMatch } from './sub-scores/certification-match';
import { ApplicantScoreInput, JobScoreInput } from './ats-scoring.types';

describe('ATS Scoring Engine Unit Tests', () => {
  const mockApplicant: ApplicantScoreInput = {
    skills: [
      { name: 'TypeScript', proficiency: 5, years: 4 },
      { name: 'React', proficiency: 4, years: 3 },
      { name: 'Node.js', proficiency: 4, years: 3 },
      { name: 'MySQL', proficiency: 3, years: 2 },
    ],
    totalExperienceYears: 4.5,
    pastJobTitles: ['Senior Frontend Developer', 'Full Stack Engineer'],
    educationLevel: "Bachelor's Degree",
    fieldOfStudy: 'Computer Science',
    certifications: ['AWS Certified Developer', 'Scrum Master'],
    rawCvText:
      'Experienced Full Stack Engineer specialized in building robust TypeScript and React web applications with Node.js and MySQL.',
  };

  const mockJob: JobScoreInput = {
    jobTitle: 'Senior Full Stack TypeScript Developer',
    jobDescriptionText:
      'We are looking for a Senior Full Stack TypeScript Developer experienced in React, Node.js, and relational database systems (MySQL).',
    requiredSkills: [
      { name: 'TypeScript', priority: 'MUST_HAVE', weight: 1.0, minProficiency: 4 },
      { name: 'React', priority: 'MUST_HAVE', weight: 1.0, minProficiency: 3 },
      { name: 'Node.js', priority: 'MUST_HAVE', weight: 1.0, minProficiency: 3 },
      { name: 'MySQL', priority: 'NICE_TO_HAVE', weight: 0.8, minProficiency: 2 },
      { name: 'GraphQL', priority: 'NICE_TO_HAVE', weight: 0.5, minProficiency: 2 },
    ],
    minExperienceYears: 3,
    maxExperienceYears: 6,
    requiredEducationLevel: "Bachelor's",
    requiredCertifications: ['AWS Certified Developer'],
  };

  it('calculates skills match correctly with matched and missing items', () => {
    const result = calculateSkillsMatch(mockApplicant, mockJob);
    expect(result.score).toBeGreaterThan(0.7);
    expect(result.matchedItems).toContain('TypeScript');
    expect(result.matchedItems).toContain('React');
    expect(result.missingItems).toContain('GraphQL');
  });

  it('calculates experience match within expected bounds', () => {
    const result = calculateExperienceMatch(mockApplicant, mockJob);
    expect(result.score).toBeGreaterThanOrEqual(0.8);
    expect(result.details?.applicantExperienceYears).toBe(4.5);
  });

  it('calculates education match accurately', () => {
    const result = calculateEducationMatch(mockApplicant, mockJob);
    expect(result.score).toBe(1.0);
  });

  it('computes semantic similarity and extracts top matching terms', () => {
    const result = calculateSemanticMatch(mockApplicant, mockJob);
    expect(result.score).toBeGreaterThan(0.3);
    expect(result.topMatchingTerms.length).toBeGreaterThan(0);
  });

  it('matches certifications successfully', () => {
    const result = calculateCertificationMatch(mockApplicant, mockJob);
    expect(result.score).toBe(1.0);
    expect(result.matchedItems).toContain('AWS Certified Developer');
  });

  it('orchestrates complete ATS score calculation and assigns high score band', () => {
    const breakdown = AtsScoringService.calculateScore(mockApplicant, mockJob);
    expect(breakdown.overallScore).toBeGreaterThanOrEqual(70);
    expect(['HIGH', 'MID']).toContain(breakdown.scoreBand);
    expect(breakdown.skillsMatch.weight).toBe(40);
    expect(breakdown.experienceMatch.weight).toBe(25);
    expect(breakdown.educationMatch.weight).toBe(15);
    expect(breakdown.semanticMatch.weight).toBe(15);
    expect(breakdown.certificationMatch.weight).toBe(5);
  });
});
