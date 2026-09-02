import { Section } from "./section";

const LISTS = ["Backlog", "In progress", "Done"];
const CARDS = ["Extract Trello tokens", "Set up Tailwind theme", "Ship board view"];
const LABEL_BARS = ["bg-label-green", "bg-label-yellow", "bg-label-orange"];

export function BoardPreview() {
  return (
    <Section title="Board preview — 272px lists, 8px cards">
      <div className="scrollbar-board flex gap-3 overflow-x-auto rounded-lg bg-brand-600 p-3">
        {LISTS.map((list, listIndex) => (
          <div key={list} className="w-list shrink-0 rounded-lg bg-canvas p-2">
            <h3 className="px-2 py-1.5 text-sm font-semibold text-text">{list}</h3>
            <ul className="space-y-2 pt-1">
              {CARDS.slice(0, 3 - listIndex).map((card, cardIndex) => (
                <li
                  key={card}
                  className="cursor-pointer rounded-md bg-surface p-2 shadow-card transition-shadow duration-100 ease-standard hover:shadow-raised"
                >
                  <span
                    className={`mb-1.5 block h-1.5 w-10 rounded-full ${LABEL_BARS[cardIndex]}`}
                  />
                  <p className="text-sm text-text">{card}</p>
                </li>
              ))}
            </ul>
            <button className="mt-2 w-full rounded-sm px-2 py-1.5 text-left text-sm text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover">
              + Add a card
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}
