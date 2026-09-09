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
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // `process.env.DATABASE_URL ?? ''`, NOT Prisma's `env('DATABASE_URL')`
    // helper. The helper throws `PrismaConfigEnvError` the moment this file is
    // loaded without the variable — and this file is loaded by EVERY CLI
    // command, including `prisma generate`, which does not need a database at
    // all.
    //
    // That matters because generate runs in `postinstall`, which on a host runs
    // at image-build time, before runtime secrets are injected. With the helper,
    // `npm ci --omit=dev` fails outright on a missing DATABASE_URL and the
    // deploy never reaches the point where the variable would have been there.
    //
    // A command that genuinely needs the connection — `migrate deploy`,
    // `studio` — still fails loudly on an empty string, just with Postgres's
    // error instead of Prisma's config error.
    url: process.env.DATABASE_URL ?? '',
  },
});
