/**
 * First letter of the first two words, uppercased — the initials shown in an
 * avatar disc. Shared by `MemberAvatars` and `WorkspaceAvatar` so the two
 * cannot drift apart.
 *
 * Single-word names yield one letter, which is the intended result: "Lantern"
 * reads better as "L" than as "LA".
 */
export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
