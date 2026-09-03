১. Admin "Invite Member" form-এ email + role দেয়
        │
        ▼
২. Backend একটা Invitation তৈরি করে
   - unique token generate করে (যেমন: abc123xyz)
   - status = PENDING
   - expiresAt = আজ + ৭ দিন
        │
        ▼
৩. ওই email-এ একটা invite link পাঠানো হয়
   যেমন: yourapp.com/invite/abc123xyz
        │
        ▼
৪. User মেইলে link পেয়ে ক্লিক করে
        │
        ├─── user আগে থেকে LOGIN করা আছে?
        │         │
        │    হ্যাঁ ▼                না ▼
        │  সরাসরি accept        আগে register/login
        │  করতে পারে           করতে বলা হয়, তারপর
        │                       accept
        ▼
৫. Accept করলে:
   - Member table-এ নতুন entry (userId + workspaceId + role)
   - Invitation status = ACCEPTED
        │
        ▼
৬. এখন সে workspace-এর member! ঢুকে project দেখতে পারে।