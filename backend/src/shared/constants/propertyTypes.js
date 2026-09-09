/**
 * The property types a workspace's project database may define, and the rule
 * each one's VALUE has to satisfy.
 *
 * One table rather than a switch in the service and a second switch in the
 * validator: a type added here without a `check` is a type that accepts
 * anything, which fails loudly at import time rather than silently at runtime.
 *
 * The string keys must stay in sync with the `PropertyType` enum in
 * prisma/schema.prisma — they are written to and read back from Postgres.
 *
 * See .claude/plan/project-property.md §2.5
 */

const TEXT_MAX = 2000;
const PHONE_MAX = 32;
const EMAIL_MAX = 254;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FILES = 20;
/* The exact shape `shared/middlewares/upload.js` generates: a UUID and an
   allowlisted extension. Anything else was not produced by this server. */
const STORED_NAME = /^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i;
// Deliberately looser than the auth module's: this is a label on a project,
// not a login, so a rejected address costs a user their data entry and buys
// nothing. Shape only.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * One entry of a FILES value.
 *
 * `url` is required to be exactly `/uploads/<storedName>` rather than merely a
 * string: a client that could set an arbitrary url would be able to make the
 * app render an image from anywhere, which is a tracking pixel at best.
 */
const isUploadedFile = (entry) =>
  Boolean(entry) &&
  typeof entry === 'object' &&
  typeof entry.id === 'string' &&
  typeof entry.name === 'string' &&
  entry.name.length <= 260 &&
  typeof entry.storedName === 'string' &&
  STORED_NAME.test(entry.storedName) &&
  entry.url === `/uploads/${entry.storedName}` &&
  Number.isFinite(entry.size) &&
  typeof entry.mime === 'string';

/** `true` when the date is real — `2026-02-31` matches the pattern and is not a date. */
const isRealDate = (value) => {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const stamp = new Date(Date.UTC(year, month - 1, day));

  return stamp.getUTCMonth() === month - 1 && stamp.getUTCDate() === day;
};

const isHttpUrl = (value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * `check(value, definition)` returns `null` when the value is acceptable and a
 * SENTENCE when it is not — the sentence reaches the client as the `422`'s
 * message, so it names the property's own rule rather than a type code.
 *
 * `null` as a value is never passed here: it means "clear this property" and
 * is handled by the service before any check runs.
 *
 * `hasOptions` is what makes `options` meaningful for exactly two types. Every
 * other type must have none — a TEXT property carrying six colour swatches
 * nobody renders is a lie the next reader has to disprove (§2.6).
 */
const PROPERTY_TYPES = {
  TEXT: {
    hasOptions: false,
    check: (value) =>
      typeof value !== 'string'
        ? 'must be text'
        : value.length > TEXT_MAX
          ? `must be ${TEXT_MAX} characters or fewer`
          : null,
  },
  NUMBER: {
    hasOptions: false,
    // `Number.isFinite` rather than `typeof === 'number'`: NaN and Infinity are
    // both numbers and neither survives a round trip through JSON.
    check: (value) => (Number.isFinite(value) ? null : 'must be a number'),
  },
  SELECT: {
    hasOptions: true,
    check: (value, definition) => {
      if (typeof value !== 'string') return 'must be one of the options';
      return optionIds(definition).includes(value) ? null : 'is not one of the options';
    },
  },
  MULTI_SELECT: {
    hasOptions: true,
    check: (value, definition) => {
      if (!Array.isArray(value)) return 'must be a list of options';
      const ids = optionIds(definition);
      return value.every((entry) => typeof entry === 'string' && ids.includes(entry))
        ? null
        : 'contains a value that is not one of the options';
    },
  },
  DATE: {
    hasOptions: false,
    check: (value) =>
      typeof value === 'string' && isRealDate(value) ? null : 'must be a date (YYYY-MM-DD)',
  },
  CHECKBOX: {
    hasOptions: false,
    check: (value) => (typeof value === 'boolean' ? null : 'must be true or false'),
  },
  URL: {
    hasOptions: false,
    check: (value) =>
      typeof value === 'string' && isHttpUrl(value) ? null : 'must be a http or https link',
  },
  EMAIL: {
    hasOptions: false,
    check: (value) =>
      typeof value === 'string' && value.length <= EMAIL_MAX && EMAIL.test(value)
        ? null
        : 'must be an email address',
  },
  /*
   * An array of upload metadata, not the bytes — `POST /uploads` writes the
   * file and hands back exactly this shape, which the client then stores here.
   *
   * Every field is checked rather than trusted: this value arrives from the
   * client, so a caller could put any `url` it liked in it and the frontend
   * would render it. Constraining `storedName` to the generated shape and
   * `url` to `/uploads/<storedName>` is what stops this property from being a
   * way to point the app at somebody else's server.
   */
  FILES: {
    hasOptions: false,
    check: (value) => {
      if (!Array.isArray(value)) return 'must be a list of files';
      if (value.length > MAX_FILES) return `cannot hold more than ${MAX_FILES} files`;

      return value.every(isUploadedFile) ? null : 'contains something that is not an uploaded file';
    },
  },
  PHONE: {
    hasOptions: false,
    // No pattern at all beyond a length cap. Phone numbers carry extensions,
    // country codes, spaces and brackets, and every regex that has ever been
    // written for them rejects somebody's real number.
    check: (value) =>
      typeof value === 'string' && value.length > 0 && value.length <= PHONE_MAX
        ? null
        : `must be a phone number of ${PHONE_MAX} characters or fewer`,
  },
};

/** The ids of a definition's options, or `[]` for a type that has none. */
function optionIds(definition) {
  return Array.isArray(definition?.options)
    ? definition.options.map((option) => option?.id).filter(Boolean)
    : [];
}

const PROPERTY_TYPE_NAMES = Object.keys(PROPERTY_TYPES);

/** Types whose `options` array is meaningful. Everything else must have none. */
const OPTION_TYPES = PROPERTY_TYPE_NAMES.filter((name) => PROPERTY_TYPES[name].hasOptions);

export { PROPERTY_TYPES, PROPERTY_TYPE_NAMES, OPTION_TYPES, optionIds };
export default PROPERTY_TYPES;
