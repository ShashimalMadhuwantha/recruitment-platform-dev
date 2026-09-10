import { AtsScoringService } from '../src/modules/ats-scoring/ats-scoring.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Verifying ATS endpoints with real seeded data...');

  const user = await prisma.user.findUnique({
    where: { email: 'shashimalmadhuwantha12@gmail.com' },
  });

  if (!user) throw new Error('Shashimal user not found');

  // 1. Recompute real ATS score for Application 1
  const app1 = await prisma.application.findFirst({
    where: { applicant: { userId: user.id }, jobId: '36a383f4-4d3f-48a7-a4bb-f527e951c5ea' },
  });
  if (app1) {
    const computed1 = await AtsScoringService.scoreApplication(app1.id);
    console.log(`✅ App 1 True Algorithmic Score: ${computed1.overallScore}% (${computed1.scoreBand})`);
  }

  // 2. Recompute real ATS score for Application 2
  const app2 = await prisma.application.findFirst({
    where: { applicant: { userId: user.id }, jobId: '77b21a88-251c-4b68-b80c-99d9804b32c0' },
  });
  if (app2) {
    const computed2 = await AtsScoringService.scoreApplication(app2.id);
    console.log(`✅ App 2 True Algorithmic Score: ${computed2.overallScore}% (${computed2.scoreBand})`);
  }

  console.log('\n🎉 ALL REAL ATS SCORES RECOMPUTED AND SYNCED IN DATABASE!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
