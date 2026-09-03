# Task Management System — Full Build Flow

Trello-style task management app (Next.js + Node.js + PostgreSQL + Prisma)।
প্রতিটা step কী কাজ করে, কীভাবে একটার সাথে আরেকটা যুক্ত — পুরোটা এখানে।

---

## Build Sequence (কোন order-এ বানাবে)

1. Auth ✅ (done)
2. Workspace ← এখন এখানে
3. Members
4. Projects
5. Backlog
6. Sprint
7. Sprint Planning
8. Columns
9. Sprint Board + Tasks (drag & drop)
10. Permissions (সবার শেষে layer করা)

---

## ১. Auth

User register / login / logout। কে app ব্যবহার করছে সেটা চেনার ব্যবস্থা।

- Email + password দিয়ে register
- Password bcrypt দিয়ে hash
- Session (NextAuth.js)
- Login না থাকলে protected page-এ ঢুকতে না দেওয়া

---

## ২. Workspace

একটা আলাদা কর্মক্ষেত্র/organization — যেমন একটা কোম্পানি বা টিমের জায়গা।
পুরো app-এর সবচেয়ে বাইরের container।

- এক user-এর একাধিক workspace থাকতে পারে
- প্রতিটা workspace-এর নিজের আলাদা member, project থাকে
- যে বানায় সে অটো OWNER হয়

**উদাহরণ:** "Acme Company" একটা workspace।

---

## ৩. Members

Workspace-এ কারা কারা আছে — সেই মানুষগুলোর তালিকা, আর কার কী role।

- Workspace-এ মানুষ invite করা হয়
- প্রত্যেকের একটা role থাকে (OWNER / ADMIN / MEMBER)

**উদাহরণ:** "Acme Company"-তে তুমি OWNER, করিম ADMIN, রহিম MEMBER।

---

## ৪. Projects

Workspace-এর ভেতরে একটা নির্দিষ্ট কাজ/product। এক workspace-এ অনেক project।

- প্রতিটা project-এর নিজের backlog, sprint, board থাকবে

**উদাহরণ:** "Acme Company" workspace-এর ভেতরে "Mobile App" আর "Website" — দুটো আলাদা project।

---

## ৫. Backlog

একটা project-এর সব কাজের গুদাম — যা যা করতে হবে সব এখানে জমা।

- সব task priority অনুযায়ী সাজানো থাকে
- এখানে কাজ শুরু হয় না, শুধু জমা থাকে

**উদাহরণ:** "Mobile App" project-এর backlog-এ — "লগইন", "পেমেন্ট", "নোটিফিকেশন" সব পড়ে আছে।

---

## ৬. Sprint

একটা সময়সীমা (start date → end date, সাধারণত ১-২ সপ্তাহ) যার মধ্যে টিম কিছু কাজ শেষ করবে।

- এটা শুধু একটা খালি সময়ের বাক্স বানানো — এখনো task ঢুকানো হয়নি

**উদাহরণ:** "Sprint 1" — ১ থেকে ১৪ জানুয়ারি।

---

## ৭. Sprint Planning

Backlog থেকে কিছু task বেছে নিয়ে sprint-এ টেনে আনা। (এখানে backlog আর sprint যুক্ত হয়)

- টিম ঠিক করে এই sprint-এ কতটুকু কাজ পারবে
- সেই task-গুলোর `sprintId` সেট হয়ে যায় (আর backlog-এ null থাকে না)

**উদাহরণ:** backlog থেকে "লগইন" আর "পেমেন্ট" টেনে "Sprint 1"-এ ঢুকালে।

---

## ৮. Columns

Sprint board-এর ধাপগুলো — কাজ কোন অবস্থায় আছে সেটা দেখানোর জন্য।

- সাধারণত: To Do → In Progress → Done
- প্রতিটা task যেকোনো এক column-এ থাকে

**উদাহরণ:** "লগইন" task এখন "In Progress" column-এ।

---

## ৯. Sprint Board + Tasks

সেই actual board যেখানে কাজ হয় — sprint-এ বেছে নেওয়া task-গুলো column-এ column-এ drag করে সরানো হয়।

- শুধু active sprint-এর task দেখায়, পুরো backlog না
- Task drag করে To Do → In Progress → Done নেওয়া হয়

**উদাহরণ:** "লগইন" শেষ হলে drag করে "Done"-এ নিয়ে গেলে।

---

## ১০. Permissions

কে কী করতে পারবে সেটার নিয়ম — সবার শেষে পুরো app-এ layer করা হয়।

- **OWNER:** সব পারে
- **ADMIN:** project, task, member manage করতে পারে
- **MEMBER:** শুধু task বানাতে/এডিট করতে পারে

**উদাহরণ:** রহিম (MEMBER) workspace delete করতে পারবে না, কিন্তু task বানাতে পারবে।

---

## পুরো জিনিসটা একসাথে

```
WORKSPACE (Acme Company)
  └── MEMBERS (তুমি=OWNER, করিম=ADMIN, রহিম=MEMBER)
  └── PROJECT (Mobile App)
        └── BACKLOG (সব task জমা: লগইন, পেমেন্ট, নোটিফিকেশন...)
              │ Sprint Planning দিয়ে বেছে নেওয়া
              ▼
        └── SPRINT 1 (১-১৪ জানু)
              └── SPRINT BOARD
                    To Do → In Progress → Done
                    (COLUMNS-এ TASKS drag করা হয়)
              │ Sprint শেষ
              ▼
        Done task = complete, বাকি task আবার BACKLOG-এ
  └── PERMISSIONS (সব ধাপে কে কী পারবে নিয়ন্ত্রণ করে)
```

---

## Sprint Flow (আলাদা করে)

```
BACKLOG (সব কাজ জমা)
   │
   ▼
SPRINT PLANNING (কিছু কাজ বেছে নেওয়া)
   │
   ▼
SPRINT BOARD (বেছে নেওয়া কাজ করা: To Do → In Progress → Done)
   │
   ▼
Sprint শেষ → Done কাজ complete, বাকি কাজ আবার Backlog-এ
```

---

## মনে রাখার সহজ সূত্র

**Workspace** (অফিস) → **Members** (কর্মী) → **Project** (কাজের প্রকল্প) →
**Backlog** (সব কাজের তালিকা) → **Sprint** (সময়ের বাক্স) → **Planning** (কাজ বাছাই) →
**Board + Columns** (কাজ করার জায়গা) → **Permissions** (নিয়ম)

---

## Prisma Schema (reference)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  members   Member[]
  createdAt DateTime @default(now())
}

model Workspace {
  id       String    @id @default(cuid())
  name     String
  members  Member[]
  projects Project[]
}

model Member {
  id          String    @id @default(cuid())
  role        Role      @default(MEMBER)
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String
  @@unique([userId, workspaceId])
}

model Project {
  id          String    @id @default(cuid())
  name        String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String
  sprints     Sprint[]
  tasks       Task[]
}

model Sprint {
  id        String       @id @default(cuid())
  name      String
  startDate DateTime
  endDate   DateTime
  status    SprintStatus @default(PLANNING)
  project   Project      @relation(fields: [projectId], references: [id])
  projectId String
  tasks     Task[]
}

model Task {
  id          String   @id @default(cuid())
  title       String
  desc        String?
  status      String   @default("TODO")   // TODO | IN_PROGRESS | DONE
  position    Float
  storyPoints Int?
  project     Project  @relation(fields: [projectId], references: [id])
  projectId   String
  sprint      Sprint?  @relation(fields: [sprintId], references: [id])
  sprintId    String?  // null = backlog, value = sprint-এ আছে
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}

enum SprintStatus {
  PLANNING
  ACTIVE
  COMPLETED
}
```

**মূল টিপস:**

- `position` field `Float` রাখো — drag করে দুই task-এর মাঝে বসাতে গেলে average নিলেই হয় (1.0 আর 2.0 এর মাঝে → 1.5)।
- `sprintId` null/not-null দিয়েই পুরো backlog vs sprint flow কাজ করে।
