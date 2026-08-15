import type { DashboardItemAuthor } from "../types";

interface RepFilterProps {
  authors: DashboardItemAuthor[];
  value: string | null;
  disabled: boolean;
  onChange: (authorId: string | null) => void;
}

export function RepFilter({ authors, value, disabled, onChange }: RepFilterProps) {
  const selectedIndex = value === null
    ? -1
    : authors.findIndex((author) => author.id === value);
  return (
    <section className="rep-filter" aria-labelledby="rep-filter-title">
      <div>
        <p className="eyebrow" id="rep-filter-title">IDS author scope</p>
        <strong>{value === null ? "All IDS Reps" : "Specific IDS Rep"}</strong>
        <span>
          Names come only from authorized records already loaded under All. The server applies the
          filter after row authorization, so it never expands access.
        </span>
      </div>
      <label>
        <span>Show records authored by</span>
        <select
          value={selectedIndex < 0 ? "" : `rep-${selectedIndex}`}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.value === "") {
              onChange(null);
              return;
            }
            const nextIndex = Number(event.target.value.replace(/^rep-/, ""));
            onChange(authors[nextIndex]?.id ?? null);
          }}
        >
          <option value="">All IDS Reps</option>
          {authors.map((author, index) => (
            <option value={`rep-${index}`} key={author.id}>{author.displayName}</option>
          ))}
        </select>
      </label>
    </section>
  );
}
