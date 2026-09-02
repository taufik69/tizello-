import { findBoard, settle } from "@/lib/boards";

/*
 * Sprint transitions. Both MOVE cards between containers rather than copying
 * or filtering — a card is in exactly one place, and its history rides along.
 * See .claude/rules/workflow.md.
 */

/** Sprint planning: pull backlog cards into the sprint's To do list. */
export function planIntoSprint(
  sprintId: string,
  cardIds: string[],
): Promise<number> {
  const backlogList = findBoard("backlog")?.lists[0];
  const todo = findBoard("sprint", sprintId)?.lists.find(
    (list) => list.status === "todo",
  );
  if (!backlogList || !todo) return settle(0);

  const moving = backlogList.cards.filter((item) => cardIds.includes(item.id));
  backlogList.cards = backlogList.cards.filter(
    (item) => !cardIds.includes(item.id),
  );
  todo.cards.push(...moving);
  return settle(moving.length);
}

/**
 * Sprint close: Done stays as the sprint's record, everything else returns to
 * the backlog. A real operation, not a filter.
 */
export function closeSprint(
  sprintId: string,
): Promise<{ completed: number; returned: number } | undefined> {
  const sprint = findBoard("sprint", sprintId);
  const backlogList = findBoard("backlog")?.lists[0];
  if (!sprint?.sprint || !backlogList) return settle(undefined);

  let returned = 0;
  let completed = 0;

  for (const list of sprint.lists) {
    if (list.status === "done") {
      completed += list.cards.length;
      continue;
    }
    returned += list.cards.length;
    backlogList.cards.push(...list.cards);
    list.cards = [];
  }

  sprint.sprint.closedOn = new Date().toISOString().slice(0, 10);
  return settle({ completed, returned });
}
