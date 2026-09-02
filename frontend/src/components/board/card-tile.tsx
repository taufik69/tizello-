import { CardLabels } from "@/components/board/card-labels";
import { CardMeta } from "@/components/board/card-meta";
import { MemberAvatars } from "@/components/board/member-avatars";
import { AppImage } from "@/components/ui/app-image";
import type { Card } from "@/types/board";

/**
 * A single card. Server Component — nothing here is interactive yet beyond the
 * button wrapper, which will open the card detail once that route exists.
 */
export function CardTile({ card }: { card: Card }) {
  return (
    <li>
      <button
        type="button"
        className="w-full space-y-2 overflow-hidden rounded-md bg-surface p-2 text-left shadow-card transition-shadow duration-100 ease-standard hover:shadow-raised"
      >
        {card.coverSrc && (
          <AppImage
            src={card.coverSrc}
            alt=""
            width={272}
            height={120}
            className="-mx-2 -mt-2 mb-1 w-[calc(100%+1rem)] max-w-none"
          />
        )}

        <CardLabels labels={card.labels} />

        <p className="text-sm text-text">{card.title}</p>

        <div className="flex items-end justify-between gap-2">
          <CardMeta card={card} />
          <MemberAvatars members={card.members} />
        </div>
      </button>
    </li>
  );
}
