import { AtsScoringService } from '../src/modules/ats-scoring/ats-scoring.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Verifying ATS endpoints with real seeded data...');

  const user = await prisma.user.findUnique({
    where: { email: 'shashimalmadhuwantha12@gmail.com' },
  });

  if (!user) throw new Error('Shashimal user not found');

  // 1. Test Match Preview on Job 2
  const preview = await AtsScoringService.previewJobMatch(
    user.id,
    '77b21a88-251c-4b68-b80c-99d9804b32c0'
  );
  console.log(`✅ Match Preview OK: Score = ${preview.overallScore}%, Band = ${preview.scoreBand}, Job = "${preview.jobTitle}"`);

  // 2. Test Application Score on Shashimal Application 1
  const appScore = await AtsScoringService.getApplicationScore('cc4e7238-878f-4c85-94d0-a37ed36d93c4');
  console.log(`✅ Application Score OK: Score = ${appScore.overallScore}%, Band = ${appScore.scoreBand}, Candidate = "${appScore.applicant?.firstName} ${appScore.applicant?.lastName}"`);
  console.log(`   Dimension breakdown: Skills=${appScore.breakdown.skillsMatch.score}%, Exp=${appScore.breakdown.experienceMatch.score}%, Edu=${appScore.breakdown.educationMatch.score}%, Semantic=${appScore.breakdown.semanticMatch.score}%`);

  console.log('\n🎉 ALL ATS SCORING DATA VERIFIED SUCCESSFULLY!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
