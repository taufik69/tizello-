/**
 * HTTP edge of the upload module.
 *
 * See .claude/skills/api-response/SKILL.md and docs/api/upload.md
 */

import path from 'node:path';

import ApiResponse from '../../shared/utils/apiResponse.js';
import httpStatus from '../../shared/constants/httpStatus.js';
import AppError from '../../shared/utils/AppError.js';
import { AUTH_CODES } from '../../shared/constants/authCodes.js';
import service from './upload.service.js';

const create = async (req, res) => {
  if (!req.file) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'No file was uploaded',
      AUTH_CODES.VALIDATION_ERROR
    );
  }

  return ApiResponse.success(res, httpStatus.CREATED, 'File uploaded', {
    file: service.toUploadedFile(req.file),
  });
};

/**
 * Serves a stored file to an authenticated caller.
 *
 * `res.sendFile` rather than `express.static` on the upload directory: static
 * middleware has no auth, so mounting it would serve every uploaded file to
 * anyone who guessed a name. This sits behind `authGuard` like everything else.
 *
 * `Content-Disposition: inline` so an image previews in the browser rather
 * than downloading; the original filename rides along for a save-as.
 */
const download = async (req, res) => {
  const filePath = service.pathForDownload(req.params.name);

  return res.sendFile(filePath, {
    headers: {
      'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
      /* Uploaded content is served from this origin, so a stored HTML or SVG
         would otherwise be a stored-XSS primitive. The type allowlist already
         excludes both; this is the second lock. */
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

export default { create, download };
