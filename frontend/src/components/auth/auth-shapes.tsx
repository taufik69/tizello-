/*
 * Layer 2 of the auth aside — one inline SVG, no JavaScript, no request.
 * Spec §5: modern geometric vocabulary, not an illustration of anything.
 *
 * Composition rules it satisfies: weighted to the upper right rather than
 * centred; three panes bleed past the viewBox and are clipped by the panel, so
 * it reads as a window onto something larger; the panes overlap in three places
 * so depth is legible; the blurred blob is the counterweight bottom-left.
 *
 * Every colour is `currentColor`, inherited from `text-on-board` on the parent
 * — that is the one ink guaranteed to clear AA against the panel gradient in
 * both themes, including at the gradient's lightest point.
 *
 * Motion is spec §5's long-loop drift: every keyframe and every `animation`
 * lives in globals.css block 7, inside
 * @media (prefers-reduced-motion: no-preference). The classes below only name
 * a loop — with `reduce` set they resolve to nothing and this stays the
 * composed still it was drawn as. No JavaScript, no library.
 */
/* Each pane keeps its own `rotate` in a transform ATTRIBUTE; the drift is a CSS
   transform on the wrapping <g>. The two do not compose on one element — a CSS
   transform replaces the attribute outright — so the group is what moves. */
const PANES = [
  { x: 330, y: 92, width: 312, height: 206, rx: 28, fillOpacity: 0.1, strokeOpacity: 0.26, transform: "rotate(-7 486 195)", drift: "auth-drift-1" },
  { x: 194, y: 230, width: 288, height: 198, rx: 26, fillOpacity: 0.15, strokeOpacity: 0.32, transform: "rotate(5 338 329)", drift: "auth-drift-2" },
  { x: 372, y: 404, width: 300, height: 212, rx: 28, fillOpacity: 0.09, strokeOpacity: 0.24, transform: "rotate(-4 522 510)", drift: "auth-drift-3" },
  { x: 116, y: 558, width: 170, height: 126, rx: 20, fillOpacity: 0.17, strokeOpacity: 0.34, transform: "rotate(10 201 621)", drift: "auth-drift-4" },
] as const;

export function AuthShapes() {
  return (
    <svg
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="auth-float pointer-events-none absolute inset-0 size-full text-on-board"
    >
      <defs>
        <pattern id="auth-grid" width="44" height="44" patternUnits="userSpaceOnUse">
          <path
            d="M44 0H0v44"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
          />
        </pattern>
        <filter id="auth-blob" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="58" />
        </filter>
      </defs>

      {/* The grid gives the glass something to sit against. Drawn past the
          viewBox on every side so the parallax drift never exposes an edge;
          the pattern is userSpaceOnUse, so the lines stay where they were. */}
      <rect
        className="auth-shape auth-grid-drift"
        x="-40"
        y="-40"
        width="680"
        height="880"
        fill="url(#auth-grid)"
        opacity="0.07"
      />

      {/* Soft organic mass, bottom-left, balancing the panes above it. */}
      <ellipse
        className="auth-shape auth-blob-breathe"
        cx="96"
        cy="668"
        rx="215"
        ry="178"
        fill="currentColor"
        opacity="0.3"
        filter="url(#auth-blob)"
      />

      {/* Two rings, concentric and cropped by the bottom-right corner. */}
      <circle
        className="auth-shape auth-ring-1"
        cx="566"
        cy="712"
        r="196"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.34"
      />
      <circle
        className="auth-shape auth-ring-2"
        cx="566"
        cy="712"
        r="124"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.2"
      />
      {/* A third, clipped by the top-left corner — keeps the weight asymmetric. */}
      <circle
        className="auth-shape auth-ring-3"
        cx="46"
        cy="86"
        r="152"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.22"
      />

      {/* Glass panes. `glass-pane` adds backdrop-filter where it is supported;
          the fill and hairline stroke carry the effect everywhere else. */}
      <g stroke="currentColor" strokeWidth="1" fill="currentColor">
        {PANES.map(({ drift, ...pane }) => (
          <g key={pane.x} className={`auth-shape ${drift}`}>
            <rect className="glass-pane" {...pane} />
          </g>
        ))}
      </g>
    </svg>
  );
}
