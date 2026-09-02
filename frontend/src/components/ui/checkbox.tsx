/**
 * A styled native checkbox. `accent-color` does the fill, so there is no
 * JavaScript, no pseudo-element stack, and the browser keeps its own focus and
 * indeterminate behaviour.
 */
export function Checkbox({
  name,
  label,
  checked,
  defaultChecked,
  onChange,
}: {
  name: string;
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-text-muted">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        className="size-4 shrink-0 rounded-xs border-border accent-brand-500"
      />
      {label}
    </label>
  );
}
