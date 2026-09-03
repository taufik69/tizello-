/** `3 projects` / `1 project`. Kept out of components so counts read the same everywhere. */
export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
