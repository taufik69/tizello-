/**
 * File uploads for project `FILES` properties.
 *
 * WHAT IS STORED WHERE
 * --------------------
 * The bytes go to disk under `config.upload.dir`; the database holds only the
 * metadata, inside the project's `properties` map. That is the same bargain
 * every file store makes, and it is why this module has no Prisma at all — a
 * later move to S3 replaces `readFile`/`unlink` here and nothing else.
 *
 * NO ORPHAN COLLECTION. A file uploaded and then never saved into a property —
 * the user closed the drawer — stays on disk. Deleting it would need the
 * server to know that no project references it, which is a scan of every
 * project's Json on every abandoned upload. It is tracked as an open question
 * rather than solved badly; a sweep job is the eventual answer.
 *
 * See docs/api/upload.md
 */

import { unlink } from 'node:fs/promises';
import path from 'node:path';

import config from '../../config/env.js';
import AppError from '../../shared/utils/AppError.js';
import httpStatus from '../../shared/constants/httpStatus.js';
import { AUTH_CODES } from '../../shared/constants/authCodes.js';

/**
 * The stored name of a file, validated as a name and not a path.
 *
 * `path.basename` alone is not enough to feel safe about: this is the value
 * that gets joined onto the upload directory, so it is checked against the
 * exact shape `upload.js` generates — a UUID and an extension, nothing else.
 * A `..`, a `/`, or a leading dot cannot match, so traversal is impossible by
 * construction rather than by careful joining.
 */
const STORED_NAME = /^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i;

const notFound = () =>
  new AppError(httpStatus.NOT_FOUND, 'File not found', AUTH_CODES.NOT_FOUND);

/** Absolute path of a stored file, or a `404` for anything that is not one of ours. */
const resolveStored = (name) => {
  if (!STORED_NAME.test(name)) throw notFound();

  return path.resolve(config.upload.dir, name);
};

/**
 * Turns multer's file into the metadata a `FILES` property value holds.
 *
 * `url` is a path on this API, not a filesystem location: the file is served
 * back through `GET /uploads/:name`, which is behind `authGuard`. A static
 * directory mounted on the app would serve every uploaded file to anyone who
 * guessed a name.
 */
const toUploadedFile = (file) => ({
  id: path.parse(file.filename).name,
  /* The name the user recognises, kept for display and for the download's
     `Content-Disposition`. It never touches the filesystem — see
     `shared/middlewares/upload.js` §1. */
  name: file.originalname,
  storedName: file.filename,
  url: `/uploads/${file.filename}`,
  size: file.size,
  mime: file.mimetype,
});

const pathForDownload = (name) => resolveStored(name);

/** Best-effort. A file that is already gone is the state the caller wanted. */
const removeStored = async (name) => {
  try {
    await unlink(resolveStored(name));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
};

export default { toUploadedFile, pathForDownload, removeStored };
