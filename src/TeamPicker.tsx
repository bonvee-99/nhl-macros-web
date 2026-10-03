import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { TeamSummary } from "./api";

interface Props {
  teams: TeamSummary[];
  value: TeamSummary | null;
  onChange: (team: TeamSummary) => void;
}

const DIVISION_ORDER = ["Atlantic", "Metropolitan", "Central", "Pacific"];

// Accent-insensitive match so "montreal" finds "Montréal Canadiens".
function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Searchable team dropdown with logos, grouped by division.
export default function TeamPicker({ teams, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filtered teams in display order (by division, then name).
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return teams
      .filter(
        (t) =>
          !q ||
          normalize(t.fullName).includes(q) ||
          t.triCode.toLowerCase().includes(q),
      )
      .sort(
        (a, b) =>
          DIVISION_ORDER.indexOf(a.division) -
            DIVISION_ORDER.indexOf(b.division) ||
          a.fullName.localeCompare(b.fullName),
      );
  }, [teams, query]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // On open: focus the search box and highlight the current team.
  // (The query is cleared on close, so `filtered` is the full list here.)
  useEffect(() => {
    if (!open) return;
    const idx = value ? filtered.findIndex((t) => t.triCode === value.triCode) : 0;
    setActive(Math.max(idx, 0));
    searchRef.current?.focus();
  }, [open]);

  // Keep the highlighted option in view.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function select(team: TeamSummary) {
    onChange(team);
    close();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) select(filtered[active]);
    } else if (e.key === "Escape") {
      close();
    }
  }

  return (
    <div className="team-picker" ref={rootRef}>
      <button
        type="button"
        id="chosen-team"
        className={`team-trigger${open ? " open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        disabled={!teams.length}
      >
        {value ? (
          <>
            <img className="team-logo" src={value.logo} alt="" />
            <span className="team-name">{value.fullName}</span>
          </>
        ) : (
          <span className="team-placeholder">
            {teams.length ? "Pick a team" : "Loading teams…"}
          </span>
        )}
        <svg className="chevron" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {open && (
        <div className="team-menu" onKeyDown={onKeyDown}>
          <input
            ref={searchRef}
            className="team-search"
            placeholder="Search teams…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            aria-label="Search teams"
          />
          <ul className="team-list" role="listbox" ref={listRef}>
            {filtered.length === 0 && <li className="team-empty">No teams match</li>}
            {filtered.map((t, i) => (
              <li key={t.triCode} role="presentation">
                {(i === 0 || filtered[i - 1].division !== t.division) && (
                  <div className="team-group">{t.division}</div>
                )}
                <div
                  role="option"
                  data-index={i}
                  aria-selected={value?.triCode === t.triCode}
                  className={`team-option${i === active ? " active" : ""}`}
                  onPointerMove={() => setActive(i)}
                  onClick={() => select(t)}
                >
                  <img className="team-logo" src={t.logo} alt="" loading="lazy" />
                  <span className="team-name">{t.fullName}</span>
                  <span className="team-code">{t.triCode}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
