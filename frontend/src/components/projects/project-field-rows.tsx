"use client";

import { PropertyRow } from "@/components/projects/property-row";
import {
  PROPERTY_META,
  type OptionalProperty,
  type ProjectDraft,
} from "@/components/projects/project-properties";
import { DateField } from "@/components/ui/date-field";
import { TextArea } from "@/components/ui/text-area";
import { ColorRowControl } from "@/components/projects/color-row-control";
import { IconRowControl } from "@/components/projects/icon-row-control";

/**
 * The project's own optional fields — description, the date pair, the icon and
 * the colour — as property rows, each shown only once it has been added.
 *
 * Split from `project-property-list.tsx` so that file stays under the 150-line
 * cap, and because these are a different KIND of row from the custom ones next
 * to them: they already exist on every project, so revealing one is not a
 * schema change and anyone who can edit the project can do it.
 *
 * Start and end are ONE row, not two: the API validates them against each
 * other, so a UI that let someone add an end date without a start date would
 * be offering a state the server rejects.
 *
 * Icon and colour are TWO rows, not one, for the opposite reason: the API
 * validates neither against the other, and they were only ever fused because
 * the shared picker was too tall to inline. Both controls are inline now.
 */
export function ProjectFieldRows({
  draft,
  errors,
  today,
  shown,
  onChange,
  onRemove,
}: {
  draft: ProjectDraft;
  errors: Record<string, string>;
  today: string;
  shown: OptionalProperty[];
  onChange: (patch: Partial<ProjectDraft>) => void;
  onRemove: (property: OptionalProperty) => void;
}) {
  return (
    <>
      {shown.includes("description") && (
        <PropertyRow
          label={PROPERTY_META.description.label}
          icon="text"
          onRemove={() => onRemove("description")}
        >
          <TextArea
            label="Description"
            hideLabel
            ghost
            rows={2}
            name="description"
            defaultValue={draft.description}
            placeholder="What is this project for?"
            maxLength={2000}
            error={errors.description}
            onValueChange={(description) => onChange({ description })}
          />
        </PropertyRow>
      )}

      {shown.includes("dates") && (
        <PropertyRow
          label={PROPERTY_META.dates.label}
          icon="calendar"
          onRemove={() => onRemove("dates")}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <DateField
              label="Start"
              hideLabel
              ghost
              placeholder="Start date"
              value={draft.startDate}
              today={today}
              error={errors.startDate}
              onChange={(startDate) => onChange({ startDate })}
            />
            <DateField
              label="End"
              hideLabel
              ghost
              placeholder="End date"
              value={draft.endDate}
              today={today}
              error={errors.endDate}
              onChange={(endDate) => onChange({ endDate })}
            />
          </div>
        </PropertyRow>
      )}

      {shown.includes("icon") && (
        <PropertyRow
          label={PROPERTY_META.icon.label}
          icon="emoji"
          onRemove={() => onRemove("icon")}
        >
          <IconRowControl icon={draft.icon} onChange={(icon) => onChange({ icon })} />
        </PropertyRow>
      )}

      {shown.includes("color") && (
        <PropertyRow
          label={PROPERTY_META.color.label}
          icon="palette"
          onRemove={() => onRemove("color")}
        >
          <ColorRowControl color={draft.color} onChange={(color) => onChange({ color })} />
        </PropertyRow>
      )}
    </>
  );
}
