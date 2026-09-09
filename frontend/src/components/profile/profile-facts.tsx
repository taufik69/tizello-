import { ProfileCard } from "@/components/profile/profile-card";
import { formatDate } from "@/lib/format-date";
import type { Profile } from "@/types/profile";

/*
 * Column three: the parts of an account that are read, not edited.
 *
 * **Email is here rather than as a disabled field**, and that is the point of
 * the component. The API refuses an `email` key rather than ignoring it, so a
 * greyed-out input would draw a control for something the server answers `400`
 * to. Facts in a `<dl>` say "this is a fact about your account" without
 * implying an edit that is being withheld.
 *
 * One fact per row, divided by hairlines — not the two-up grid
 * `WorkspaceDetailFacts` uses. That page gives its facts the full page width,
 * where two or three columns of short values read well; this one is a third of
 * it, and an email address in a half-column cell would wrap or truncate on
 * every account whose address is longer than "sam@acme.co".
 *
 * `formatDate` rather than `toLocaleDateString()`: the latter resolves against
 * the host, so the container's locale on the server and the reader's in the
 * browser disagree and React throws the node away with a hydration mismatch.
 * That file has the full reasoning.
 */
export function ProfileFacts({ profile }: { profile: Profile }) {
  const facts = [
    { term: "Email", detail: profile.email, wrap: true },
    {
      term: "Email status",
      detail: profile.emailVerified ? "Verified" : "Not verified yet",
    },
    { term: "Member since", detail: formatDate(profile.createdAt) },
    { term: "Last updated", detail: formatDate(profile.updatedAt) },
  ];

  return (
    <ProfileCard title="Account">
      <dl className="divide-y divide-border">
        {facts.map((fact) => (
          <div key={fact.term} className="py-3 first:pt-0">
            <dt className="text-2xs font-medium tracking-wide text-text-subtle uppercase">
              {fact.term}
            </dt>
            <dd
              className={`mt-1 text-sm text-text ${fact.wrap ? "break-all" : ""}`}
            >
              {fact.detail}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-auto pt-6 text-2xs text-text-subtle">
        Your email address is how you sign in and how invitations reach you, so
        it cannot be changed here.
      </p>
    </ProfileCard>
  );
}
