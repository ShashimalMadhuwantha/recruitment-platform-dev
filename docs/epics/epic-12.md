# Epic 12: Communication, Scheduling & Notifications

## Overview
Epic 12 implements the complete **Communication, Scheduling & Notifications** workflow according to `docs/Recruitment_Platform_SRS.md` (§3.2.3, `FR-RC-17` to `FR-RC-20`, §3.2.4, `FR-AP-25` to `FR-AP-27`) and `docs/Epic_Backlog.md`.
It connects recruiters and applicants throughout the hiring journey through:
1. **In-App Messaging System (`FR-RC-17`, `FR-AP-25`)**: Application-scoped direct messaging threads between hiring teams and candidates with real-time delivery, unread indicators, and auto-scroll chat drawers.
2. **Interview Scheduling with Calendar Synchronization (`FR-RC-18`, `FR-AP-26`)**: Timezone-aware date and duration scheduling for interviews, complete with automated `.ics` calendar invitation file generation (RFC 5545) for Google Calendar, Outlook, and Apple Calendar.
3. **Auto-Generated Video Conference Links (`FR-RC-19`)**: One-click generation of secure, dedicated video meeting rooms (e.g. Jitsi Meet / external conferencing integration) embedded into meeting invites.
4. **Structured Interview Feedback Scorecards (`FR-RC-20`)**: Standardized evaluation scorecards allowing interviewers to rate candidates across core competency dimensions (Technical Competency, Communication, Problem Solving, Role Experience, and Cultural Fit) with definitive hiring recommendations (`STRONG_HIRE`, `HIRE`, `NEUTRAL`, `DO_NOT_HIRE`, `STRONG_DO_NOT_HIRE`) and private notes.
5. **Multi-Channel Event & Status Notifications (`FR-AP-27`)**: Automatic in-app notification bell with live unread count badges and transactional email notifications triggered on pipeline stage transitions, interview bookings, and new chat messages.

---

## 1. Features Implemented

### 1.1 In-App Messaging System (`FR-RC-17`, `FR-AP-25`)
- **Application Context**:
  - Every message is tied to an `application_id`, ensuring conversations stay strictly anchored to the specific job vacancy and candidate application.
  - Access is restricted: only the applicant who submitted the application, or authorized recruiters of the employer company (and Super Admins), can view or post messages in the thread.
- **Real-Time Experience**:
  - Sliding chat drawer (`ApplicationMessageDrawer`) accessible from the Recruiter Pipeline (`CandidateDetailDrawer`) and the Applicant Dashboard.
  - Chronological message bubbles clearly distinguishing sender vs receiver with timestamps and read receipts (`readAt`).
  - Automatic mark-as-read mechanism when a user loads or views the conversation.

### 1.2 Interview Scheduling & Calendar Integration (`FR-RC-18`, `FR-AP-26`)
- **Interview Scheduler Modal (`InterviewSchedulerModal`)**:
  - Configurable interview title, interview format (`VIDEO`, `PHONE`, `IN_PERSON`), date/time picker, duration (15, 30, 45, 60, 90 mins), and timezone.
  - Optional preparation notes for the candidate and physical location address (for in-person rounds).
- **Automated Video Meeting Room Generation (`FR-RC-19`)**:
  - Auto-generates a secure, randomized video meeting link (e.g. `https://meet.jit.si/ats-interview-<UUID>`) if no custom link is provided.
- **Calendar Invite (.ics) Export**:
  - Generates standard RFC 5545 `.ics` iCalendar files via `GET /api/v1/interviews/:id/calendar.ics` for one-click import into Google Calendar, Microsoft Outlook, and Apple iCal.
  - Includes event title, duration, video URL, summary description, and organizer information.

### 1.3 Structured Interview Feedback & Scorecards (`FR-RC-20`)
- **Interview Scorecard Form (`InterviewScorecardModal`)**:
  - Dimension-based rating system (1 to 5 stars) evaluating:
    1. Technical Competencies & Problem Solving
    2. Communication & Collaboration
    3. Relevant Domain & Role Experience
    4. Cultural Fit & Values Alignment
  - Computed overall score average.
  - Definitive hiring recommendation:
    - `STRONG_HIRE` (Green)
    - `HIRE` (Emerald)
    - `NEUTRAL` (Amber)
    - `DO_NOT_HIRE` (Rose)
    - `STRONG_DO_NOT_HIRE` (Crimson)
  - Qualitative interviewer notes for strengths, gaps, and decision rationale.

### 1.4 Central Notification Center & Multi-Channel Sync (`FR-AP-27`)
- **Notification Bell & Popover (`NotificationBell`)**:
  - Persistent in the top navigation header for all authenticated roles.
  - Red badge counter displaying live unread notification counts.
  - Interactive popover with "All" and "Unread" filters, relative timestamps, and "Mark all as read" action.
  - Clickable links that route directly to the relevant application, interview, or candidate view.
- **Automated Event Triggers**:
  - **Stage Movement**: When a candidate is moved to `SHORTLISTED`, `INTERVIEW`, `OFFER`, or `REJECTED`, in-app and email notifications are triggered.
  - **New Message**: When a recruiter or applicant sends a message, an in-app notification alerts the recipient.
  - **Interview Scheduled**: Notifies both applicant and interviewer with meeting details.
  - **Feedback Submitted**: Notifies hiring managers when an interviewer submits a scorecard.

---

## 2. Database Models

```prisma
model ApplicationMessage {
  id            String    @id @default(uuid())
  applicationId String    @map("application_id")
  senderId      String    @map("sender_id")
  receiverId    String    @map("receiver_id")
  body          String    @db.Text
  isRead        Boolean   @default(false) @map("is_read")
  readAt        DateTime? @map("read_at")
  createdAt     DateTime  @default(now()) @map("created_at")

  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  sender      User        @relation("SentApplicationMessages", fields: [senderId], references: [id], onDelete: Cascade)
  receiver    User        @relation("ReceivedApplicationMessages", fields: [receiverId], references: [id], onDelete: Cascade)

  @@index([applicationId, createdAt])
  @@index([receiverId, isRead])
  @@map("application_messages")
}

model InterviewSchedule {
  id            String    @id @default(uuid())
  applicationId String    @map("application_id")
  interviewerId String    @map("interviewer_id")
  title         String    @default("Interview")
  interviewType String    @default("VIDEO") @map("interview_type")
  scheduledAt   DateTime  @map("scheduled_at")
  durationMins  Int       @default(45) @map("duration_mins")
  timezone      String    @default("UTC")
  videoLink     String?   @map("video_link")
  location      String?
  status        String    @default("SCHEDULED")
  notes         String?   @db.Text
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @default(now()) @updatedAt @map("updated_at")

  application        Application         @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  interviewer        User                @relation("InterviewerSchedules", fields: [interviewerId], references: [id])
  interviewFeedbacks InterviewFeedback[]

  @@index([applicationId])
  @@index([interviewerId])
  @@map("interview_schedules")
}

model InterviewFeedback {
  id             String   @id @default(uuid())
  interviewId    String   @map("interview_id")
  interviewerId  String   @map("interviewer_id")
  scorecardJson  Json?    @map("scorecard_json")
  recommendation String?
  notes          String?  @db.Text
  submittedAt    DateTime @default(now()) @map("submitted_at")
  updatedAt      DateTime @default(now()) @updatedAt @map("updated_at")

  interview   InterviewSchedule @relation(fields: [interviewId], references: [id], onDelete: Cascade)
  interviewer User              @relation("InterviewerFeedbacks", fields: [interviewerId], references: [id])

  @@unique([interviewId, interviewerId])
  @@map("interview_feedbacks")
}

model Notification {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  type        String
  title       String
  message     String    @db.Text
  link        String?
  payloadJson Json?     @map("payload_json")
  isRead      Boolean   @default(false) @map("is_read")
  readAt      DateTime? @map("read_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([createdAt])
  @@map("notifications")
}
```

---

## 3. API Endpoints Reference

All endpoints are mounted under `/api/v1` and require authenticated session tokens.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/applications/:applicationId/messages` | Send an in-app message within an application thread |
| `GET` | `/api/v1/applications/:applicationId/messages` | Get all messages in application thread & mark incoming as read |
| `POST` | `/api/v1/applications/:applicationId/interviews` | Schedule an interview for an applicant |
| `GET` | `/api/v1/applications/:applicationId/interviews` | List all scheduled interviews for an application |
| `GET` | `/api/v1/interviews/:id` | Get interview details with feedback status |
| `PATCH` | `/api/v1/interviews/:id/status` | Update interview status (`SCHEDULED`, `COMPLETED`, `CANCELLED`) |
| `GET` | `/api/v1/interviews/:id/calendar.ics` | Download RFC 5545 `.ics` iCalendar file for the interview |
| `POST` | `/api/v1/interviews/:id/feedback` | Submit structured interviewer scorecard and recommendation |
| `GET` | `/api/v1/interviews/:id/feedback` | Get feedback scorecards for an interview |
| `GET` | `/api/v1/notifications` | Get user notifications with pagination and unread filter |
| `GET` | `/api/v1/notifications/unread-count` | Get count of unread notifications for badge indicator |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark single notification as read |
| `POST` | `/api/v1/notifications/mark-all-read` | Mark all user notifications as read |
