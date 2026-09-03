import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { TabList, type TabDescriptor } from "@/components/ui/tabs";

/**
 * The tab strip and the one action above the lists.
 *
 * The counts live in the tab labels rather than in the server-rendered header,
 * because they move with the client state — a count rendered upstream would go
 * stale the moment a member is removed or an invite is cancelled.
 *
 * The `<h2>` is visually hidden: the tab strip already names both sections on
 * screen, and repeating "Workspace access" above it would be noise. It is here
 * so the heading order still descends from the page's `<h1>`.
 */
export function MembersToolbar({
  group,
  tabs,
  tab,
  onTabChange,
  onInvite,
}: {
  group: string;
  tabs: TabDescriptor[];
  tab: string;
  onTabChange: (value: string) => void;
  onInvite: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="sr-only">Workspace access</h2>

      <TabList
        group={group}
        label="Workspace access"
        tabs={tabs}
        value={tab}
        onValueChange={onTabChange}
      />

      <Button onClick={onInvite}>
        <PlusIcon className="size-4" />
        Invite member
      </Button>
    </div>
  );
}
