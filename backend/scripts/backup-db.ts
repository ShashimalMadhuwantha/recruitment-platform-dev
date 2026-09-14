import fs from 'fs';
import path from 'path';
import { prisma } from '../src/db/client';

const BACKUP_DIR = path.resolve(__dirname, '..', 'backups');
const RETENTION_DAYS = 7;

interface BackupMetadata {
  timestamp: string;
  version: string;
  database: string;
  tableCounts: Record<string, number>;
}

async function runBackup() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 [BackupService] Initializing automated MySQL database backup (NFR-16)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
  }

  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFileName = `db-backup-${dateStr}.json`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  const snapshot: Record<string, any> = {};
  const counts: Record<string, number> = {};

  try {
    // 1. Snapshot Core Platform Tables
    console.log('⏳ Extracting table snapshots...');

    const [
      users,
      companies,
      recruiterProfiles,
      applicantProfiles,
      applicantSkills,
      skills,
      jobs,
      applications,
      atsScores,
      pipelineStages,
      candidateNotes,
      interviewSchedules,
      interviewFeedbacks,
      offers,
      userNotificationPreferences,
      companyBlocks,
      companyFollows,
      gdprRequests,
      auditLogs,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.company.findMany(),
      prisma.recruiterProfile.findMany(),
      prisma.applicantProfile.findMany(),
      prisma.applicantSkill.findMany(),
      prisma.skill.findMany(),
      prisma.jobVacancy.findMany(),
      prisma.application.findMany(),
      prisma.aTSScore.findMany(),
      prisma.pipelineStage.findMany(),
      prisma.candidateNote.findMany(),
      prisma.interviewSchedule.findMany(),
      prisma.interviewFeedback.findMany(),
      prisma.jobOffer.findMany(),
      prisma.userNotificationPreference.findMany(),
      prisma.companyBlock.findMany(),
      prisma.companyFollow.findMany(),
      prisma.gdprRequest.findMany(),
      prisma.auditLog.findMany({ take: 500, orderBy: { createdAt: 'desc' } }),
    ]);

    snapshot.users = users;
    counts.users = users.length;

    snapshot.companies = companies;
    counts.companies = companies.length;

    snapshot.recruiterProfiles = recruiterProfiles;
    counts.recruiterProfiles = recruiterProfiles.length;

    snapshot.applicantProfiles = applicantProfiles;
    counts.applicantProfiles = applicantProfiles.length;

    snapshot.applicantSkills = applicantSkills;
    counts.applicantSkills = applicantSkills.length;

    snapshot.skills = skills;
    counts.skills = skills.length;

    snapshot.jobs = jobs;
    counts.jobs = jobs.length;

    snapshot.applications = applications;
    counts.applications = applications.length;

    snapshot.atsScores = atsScores;
    counts.atsScores = atsScores.length;

    snapshot.pipelineStages = pipelineStages;
    counts.pipelineStages = pipelineStages.length;

    snapshot.candidateNotes = candidateNotes;
    counts.candidateNotes = candidateNotes.length;

    snapshot.interviewSchedules = interviewSchedules;
    counts.interviewSchedules = interviewSchedules.length;

    snapshot.interviewFeedbacks = interviewFeedbacks;
    counts.interviewFeedbacks = interviewFeedbacks.length;

    snapshot.offers = offers;
    counts.offers = offers.length;

    snapshot.userNotificationPreferences = userNotificationPreferences;
    counts.userNotificationPreferences = userNotificationPreferences.length;

    snapshot.companyBlocks = companyBlocks;
    counts.companyBlocks = companyBlocks.length;

    snapshot.companyFollows = companyFollows;
    counts.companyFollows = companyFollows.length;

    snapshot.gdprRequests = gdprRequests;
    counts.gdprRequests = gdprRequests.length;

    snapshot.auditLogs = auditLogs;
    counts.auditLogs = auditLogs.length;

    const metadata: BackupMetadata = {
      timestamp: now.toISOString(),
      version: '1.0.0',
      database: 'recruitment_ats_db',
      tableCounts: counts,
    };

    const payload = {
      metadata,
      data: snapshot,
    };

    // Write file
    fs.writeFileSync(backupFilePath, JSON.stringify(payload, null, 2), 'utf-8');
    const stats = fs.statSync(backupFilePath);
    const sizeKb = (stats.size / 1024).toFixed(2);

    console.log(`✅ Backup successfully created: ${backupFileName} (${sizeKb} KB)`);
    console.log('📊 Records backed up:');
    Object.entries(counts).forEach(([tbl, count]) => {
      if (count > 0) {
        console.log(`   • ${tbl}: ${count} records`);
      }
    });

    // 2. Enforce 7-day retention policy (NFR-16)
    console.log(`🧹 Enforcing retention policy (retention window: ${RETENTION_DAYS} days)...`);
    const cutoffTime = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const existingFiles = fs.readdirSync(BACKUP_DIR);
    let purgedCount = 0;

    for (const file of existingFiles) {
      if (file.startsWith('db-backup-') && file.endsWith('.json')) {
        const filePath = path.join(BACKUP_DIR, file);
        const fileStat = fs.statSync(filePath);
        if (fileStat.mtimeMs < cutoffTime) {
          fs.unlinkSync(filePath);
          purgedCount++;
          console.log(`   🗑️ Purged expired backup archive: ${file}`);
        }
      }
    }

    if (purgedCount === 0) {
      console.log('   ✨ All existing backups are within the active retention window.');
    } else {
      console.log(`   ✨ Purged ${purgedCount} expired backup file(s).`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Database backup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module || process.argv[1]?.includes('backup-db')) {
  runBackup();
}

export { runBackup };
