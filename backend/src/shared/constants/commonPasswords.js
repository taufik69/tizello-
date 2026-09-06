/**
 * The passwords registration and password-reset refuse outright.
 *
 * Deliberately a small, high-frequency list rather than a full breach corpus.
 * The realistic attack this defends against is credential *spraying* — one
 * attacker trying `Password123!` against every address in a workspace — and
 * that attack only ever uses the head of the distribution. Blocking the top few
 * hundred stops it; shipping ten million hashes and a lookup service does not
 * stop it any harder and turns a validator into infrastructure.
 *
 * It is a floor, not a policy. Composition rules (a digit, a symbol, mixed
 * case) are deliberately *absent*: they push users toward `Passw0rd!` — which
 * satisfies every rule and is on this list — while blocking the long
 * passphrases that are actually strong. Length plus a common-password check is
 * the modern guidance (NIST SP 800-63B) and it is what the frontend enforces
 * too.
 *
 * Comparison is case-insensitive and trimmed at the call site, so `PASSWORD`
 * and `Password ` are caught by the single lowercase entry here.
 *
 * See .claude/specs/auth/auth.sprint2.md §2.2
 */

const COMMON_PASSWORDS = new Set([
  '123456',
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password1',
  'password123',
  'passw0rd',
  'p@ssw0rd',
  'p@ssword',
  'qwerty',
  'qwerty123',
  'qwertyuiop',
  'abc123',
  'abcd1234',
  'iloveyou',
  'admin',
  'admin123',
  'administrator',
  'welcome',
  'welcome1',
  'welcome123',
  'letmein',
  'monkey',
  'dragon',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'superman',
  'trustno1',
  'starwars',
  'whatever',
  'zaq12wsx',
  '1qaz2wsx',
  'asdfghjkl',
  'michael',
  'jennifer',
  'jordan23',
  'changeme',
  'secret',
  'test1234',
  'testtest',
  'temp1234',
  'summer2024',
  'summer2025',
  'winter2024',
  'winter2025',
  'january1',
  'freedom',
  'ninja123',
  'pokemon',
  'minecraft',
  'computer',
  'internet',
  'samsung',
  'google123',
  'facebook',
  '11111111',
  '00000000',
  '87654321',
  'aaaaaaaa',
  'asdfasdf',
  '123123123',
  'qazwsxedc',
]);

/**
 * True when the password is on the list. Lowercased and trimmed here so no
 * caller has to remember to — a check that is only correct when called
 * correctly is a check that eventually is not.
 */
const isCommonPassword = (password) =>
  COMMON_PASSWORDS.has(String(password ?? '').trim().toLowerCase());

export { COMMON_PASSWORDS, isCommonPassword };
export default isCommonPassword;
