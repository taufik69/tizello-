import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileCard } from "@/components/profile/profile-card";
import { initials } from "@/lib/initials";
import type { Profile } from "@/types/profile";

/*
 * Column one: who this account is, and the one control that changes how it
 * looks.
 *
 * The disc is rendered HERE and only the buttons come from `ProfileAvatar`, a
 * client leaf. Splitting them keeps the photo itself on the server, so the only
 * JavaScript this column ships is the upload handler.
 *
 * `mt-auto` on the controls is what makes this card work at a shared height:
 * the identity block sits at the top, the controls are pinned to the bottom
 * edge, and the slack between them absorbs whatever the tallest column is. A
 * fixed margin would leave the buttons floating mid-card instead.
 *
 * Deliberately no "online" dot, unlike `AccountMenuTrigger`. That one matches a
 * reference layout at 28px where the dot is decoration; at 80px on the screen
 * that is *about* this account it would read as a presence claim, and this app
 * has no presence system.
 */
export function ProfileIdentityCard({
  profile,
  name,
  avatarSrc,
}: {
  profile: Profile;
  name: string;
  avatarSrc: string | null;
}) {
  return (
    <ProfileCard title="You">
      <div className="flex flex-col items-center text-center">
        <Avatar className="size-20 border border-border bg-surface-sunken text-text-muted">
          <AvatarFallback className="text-xl">
            <span aria-hidden="true">{initials(name)}</span>
          </AvatarFallback>
          {avatarSrc && (
            <AvatarImage src={avatarSrc} alt={`${name}'s profile photo`} />
          )}
        </Avatar>

        <h3 className="mt-4 text-base font-semibold tracking-tight break-words text-text">
          {name}
        </h3>

        {/* The full name only when it is not already the heading — a nickname
            makes it a second, useful line; without one it would repeat. */}
        {profile.nickname && profile.name && (
          <p className="mt-0.5 text-sm break-words text-text-muted">
            {profile.name}
          </p>
        )}

        {/* `brand`, not a success token: DESIGN-SYSTEM.md notes the brand IS
            green, so a second green would read as a bug. `warning` carries
            neutral ink on an amber fill, for the contrast reason that file
            measures out. */}
        <div className="mt-3">
          <Badge variant={profile.emailVerified ? "brand" : "warning"}>
            {profile.emailVerified ? "Email verified" : "Email unverified"}
          </Badge>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <ProfileAvatar hasPhoto={Boolean(avatarSrc)} />
      </div>
    </ProfileCard>
  );
}
