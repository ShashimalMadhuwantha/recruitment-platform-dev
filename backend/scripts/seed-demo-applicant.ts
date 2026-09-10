import fs from 'fs';
import path from 'path';
import * as bcrypt from 'bcrypt';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const prisma = new PrismaClient();

async function generateSamplePdf(outputPath: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  let y = height - 50;

  // Header - Name
  page.drawText('Alex Turner', {
    x: 50,
    y,
    size: 24,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  y -= 20;
  // Professional Headline
  page.drawText('Senior Full-Stack Engineer — React & Node.js Specialist', {
    x: 50,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.7),
  });

  y -= 20;
  // Contact details
  page.drawText('Email: alex.turner.dev@example.com   |   Phone: +1 (415) 555-0199   |   Location: San Francisco, CA', {
    x: 50,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.35, 0.35, 0.35),
  });

  y -= 15;
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.8, 0.85, 0.9),
  });

  y -= 25;
  // Section: Profile / Summary
  page.drawText('PROFILE', {
    x: 50,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  y -= 16;
  const summaryText =
    'Passionate and results-driven Software Engineer with 4+ years of professional experience architecting high-throughput cloud applications and responsive modern web interfaces. Dedicated to clean code, automated testing, and scalable microservice architectures.';
  page.drawText(summaryText, {
    x: 50,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
    maxWidth: width - 100,
    lineHeight: 14,
  });

  y -= 45;
  // Section: Technical Skills
  page.drawText('SKILLS', {
    x: 50,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  y -= 18;
  const skillsList = [
    '• Frontend: React, TypeScript, Next.js, JavaScript, Tailwind CSS, HTML5, CSS3, Redux',
    '• Backend & Cloud: Node.js, Express.js, PostgreSQL, MySQL, Docker, AWS, REST APIs',
    '• Architecture & Tools: Microservices Architecture, Git, CI/CD Pipelines, Unit Testing',
  ];
  for (const s of skillsList) {
    page.drawText(s, {
      x: 50,
      y,
      size: 10,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 15;
  }

  y -= 15;
  // Section: Work Experience
  page.drawText('WORK EXPERIENCE', {
    x: 50,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  y -= 18;
  page.drawText('CloudScale Technologies Inc.', {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 14;
  page.drawText('Senior Full-Stack Engineer   |   Jan 2022 – Present   |   San Francisco, CA', {
    x: 50,
    y,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  y -= 15;
  const exp1Bullets = [
    '• Architected and scaled distributed backend microservices in Node.js and TypeScript handling 10M+ daily events.',
    '• Built dynamic enterprise web dashboards with React and Tailwind CSS improving customer workflows by 35%.',
    '• Mentored junior engineers and instituted automated end-to-end testing, boosting code coverage to 92%.',
  ];
  for (const b of exp1Bullets) {
    page.drawText(b, {
      x: 50,
      y,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
      maxWidth: width - 100,
      lineHeight: 13,
    });
    y -= 15;
  }

  y -= 10;
  page.drawText('Apex Software Solutions', {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 14;
  page.drawText('Full-Stack Developer   |   Jun 2020 – Dec 2021   |   San Jose, CA', {
    x: 50,
    y,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  y -= 15;
  const exp2Bullets = [
    '• Designed and implemented full-stack REST APIs using Express.js, TypeScript, and PostgreSQL.',
    '• Developed responsive UI components with React and state management using Redux Toolkit.',
    '• Integrated Docker containerization into the continuous integration pipeline for rapid deployments.',
  ];
  for (const b of exp2Bullets) {
    page.drawText(b, {
      x: 50,
      y,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
      maxWidth: width - 100,
      lineHeight: 13,
    });
    y -= 15;
  }

  y -= 15;
  // Section: Education
  page.drawText('EDUCATION', {
    x: 50,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  y -= 18;
  page.drawText('University of California, Berkeley', {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 14;
  page.drawText('Bachelor of Science in Computer Science   |   Graduated May 2020   |   GPA: 3.85', {
    x: 50,
    y,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  y -= 25;
  // Section: Certifications
  page.drawText('CERTIFICATIONS', {
    x: 50,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  y -= 16;
  page.drawText('• AWS Certified Solutions Architect (Associate)', {
    x: 50,
    y,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  const pdfBytes = await pdfDoc.save();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`📄 Sample CV PDF generated at: ${outputPath}`);
}

async function seedDemoApplicant() {
  console.log('👤 Seeding fresh demo applicant user...');

  const email = 'candidate.demo@atsplatform.local';
  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Create or update user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      status: UserStatus.ACTIVE,
      role: UserRole.APPLICANT,
    },
    create: {
      email,
      passwordHash,
      role: UserRole.APPLICANT,
      status: UserStatus.ACTIVE,
    },
  });

  // 2. Ensure clean ApplicantProfile
  let profile = await prisma.applicantProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    profile = await prisma.applicantProfile.create({
      data: {
        userId: user.id,
        firstName: 'Alex',
        lastName: 'Turner',
        headline: 'Senior Full-Stack Engineer',
        summary: 'Passionate and results-driven Software Engineer with 4+ years of professional experience.',
        location: 'San Francisco, CA',
        phone: '+1 (415) 555-0199',
        visibilitySettings: {
          visibility: 'PUBLIC',
          allowRecruiterContact: true,
        },
      },
    });
  } else {
    // Reset CVs and items so the applicant is clean and ready for PDF upload testing
    await prisma.cV.deleteMany({ where: { applicantId: profile.id } });
    await prisma.applicantSkill.deleteMany({ where: { applicantId: profile.id } });
    await prisma.workExperience.deleteMany({ where: { applicantId: profile.id } });
    await prisma.education.deleteMany({ where: { applicantId: profile.id } });

    profile = await prisma.applicantProfile.update({
      where: { id: profile.id },
      data: {
        firstName: 'Alex',
        lastName: 'Turner',
        headline: 'Senior Full-Stack Engineer',
        summary: 'Passionate and results-driven Software Engineer with 4+ years of professional experience.',
        location: 'San Francisco, CA',
        phone: '+1 (415) 555-0199',
        visibilitySettings: {
          visibility: 'PUBLIC',
          allowRecruiterContact: true,
        },
      },
    });
  }

  console.log(`✅ Demo Applicant seeded successfully:`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Profile ID: ${profile.id}`);

  // 3. Generate sample PDF resume in public/samples/ directory
  const publicSamplesDir = path.resolve(process.cwd(), '../frontend/public/samples');
  const samplePdfPath = path.join(publicSamplesDir, 'Alex_Turner_Software_Engineer_CV.pdf');
  await generateSamplePdf(samplePdfPath);

  // Also copy to backend uploads or local folder for easy access
  const backendSamplePath = path.resolve(process.cwd(), 'uploads/samples/Alex_Turner_Software_Engineer_CV.pdf');
  fs.mkdirSync(path.dirname(backendSamplePath), { recursive: true });
  fs.copyFileSync(samplePdfPath, backendSamplePath);
  console.log(`📄 Also saved copy at: ${backendSamplePath}`);

  // Verify parser extracts text cleanly from this PDF
  const { PDFParse } = require('pdf-parse');
  const buf = fs.readFileSync(samplePdfPath);
  const parser = new PDFParse({ data: buf });
  const textRes = await parser.getText();
  await parser.destroy();
  console.log(`🔍 Verification of generated PDF text extraction: length = ${textRes.text.length} characters`);
  console.log(`   Preview: ${textRes.text.slice(0, 150).replace(/\n/g, ' ')}...`);
}

seedDemoApplicant()
  .catch((err) => {
    console.error('Error seeding demo applicant:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
