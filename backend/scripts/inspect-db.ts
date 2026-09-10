import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING USERS ===');
  const users = await prisma.user.findMany({
    include: {
      recruiterProfile: {
        include: { company: true },
      },
      applicantProfile: true,
    },
  });

  console.log(`Total users in database: ${users.length}`);
  users.filter(u => u.email.includes('gmail') || u.email.includes('lasindu') || u.role === 'RECRUITER').forEach((u) => {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Status: ${u.status}, Company: ${u.recruiterProfile?.company?.name || 'N/A'} (ID: ${u.recruiterProfile?.companyId || 'N/A'})`);
  });

  console.log('\n=== CHECKING ALL JOB VACANCIES ===');
  const jobs = await prisma.jobVacancy.findMany({
    include: { company: true }
  });

  console.log(`Total job vacancies in database: ${jobs.length}`);
  jobs.forEach((j) => {
    console.log(`- ID: ${j.id}, Title: "${j.title}", Status: ${j.status}, Company: ${j.company?.name} (${j.companyId}), CreatorID: ${j.createdById}, CreatedAt: ${j.createdAt}`);
  });

  console.log('\n=== CHECKING AUDIT LOGS FOR LASINDU ===');
  const lasindu = await prisma.user.findUnique({
    where: { email: 'lasinduthemiya96@gmail.com' },
    include: { recruiterProfile: { include: { company: true } } },
  });
  console.log('Lasindu user:', JSON.stringify(lasindu, null, 2));

  const shashimal = await prisma.user.findUnique({
    where: { email: 'shashimalmadhuwantha12@gmail.com' },
    include: {
      applicantProfile: {
        include: {
          applicantSkills: { include: { skill: true } },
          workExperiences: true,
          educations: true,
          cvs: true,
          applications: {
            include: {
              job: true,
              atsScore: true,
            },
          },
        },
      },
    },
  });
  console.log('Shashimal applicant:', JSON.stringify(shashimal, null, 2));

  console.log('\n=== ALL APPLICATIONS IN DB ===');
  const allApps = await prisma.application.findMany({
    include: {
      job: { select: { id: true, title: true, company: { select: { name: true } } } },
      applicant: { select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } } },
      atsScore: true,
    },
  });
  console.log(`Total applications: ${allApps.length}`);
  allApps.forEach((a) => {
    console.log(`- App ID: ${a.id}, Job ID: ${a.jobId} ("${a.job.title}"), Applicant: ${a.applicant.firstName} ${a.applicant.lastName} (${a.applicant.user.email}), Score: ${a.atsScore?.overallScore ?? 'N/A'}`);
  });
}

main()
  .catch((err) => {
    console.error('Error in inspect-db:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
