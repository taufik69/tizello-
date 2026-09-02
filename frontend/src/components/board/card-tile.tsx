import { CardLabels } from "@/components/board/card-labels";
import { CardMeta } from "@/components/board/card-meta";
import { MemberAvatars } from "@/components/board/member-avatars";
import { AppImage } from "@/components/ui/app-image";
import type { Card } from "@/types/board";

/**
 * A single card, Notion-style: a hairline border and a flat surface rather than
 * Trello's drop shadow. Depth comes from the border and a hover fill, which
 * keeps a dense column calm — twenty shadowed cards read as noise.
 *
 * Server Component.
 */
export function CardTile({ card }: { card: Card }) {
  return (
    <li>
      <button
        type="button"
        className="block w-full overflow-hidden rounded-sm border border-border bg-surface text-left transition-colors duration-100 ease-standard hover:bg-surface-hover"
      >
        {card.coverSrc && (
          <AppImage
            src={card.coverSrc}
            alt=""
            width={272}
            height={120}
            className="w-full border-b border-border"
          />
        )}

        <div className="space-y-1.5 px-2.5 py-2">
          <p className="flex items-start gap-1.5 text-sm text-text">
            <CardLabels labels={card.labels} />
            <span>{card.title}</span>
          </p>

          <div className="flex items-center justify-between gap-2 empty:hidden">
            <CardMeta card={card} />
            <MemberAvatars members={card.members} />
          </div>
        </div>
      </button>
    </li>
  );
}
