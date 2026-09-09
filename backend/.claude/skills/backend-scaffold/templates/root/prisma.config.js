/**
 * Prisma CLI configuration (Prisma 7+).
 *
 * Prisma 7 removed `url` from the datasource block in schema.prisma, so the
 * connection string for CLI commands — `migrate`, `db push`, `studio` — is
 * declared here instead. The running application does NOT read this file: it
 * reaches Postgres through the pg driver adapter in src/config/db.js.
 *
 * dotenv is loaded explicitly because the Prisma CLI no longer does it for us.
 *
 * See .claude/skills/backend-scaffold/SKILL.md
 */

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
