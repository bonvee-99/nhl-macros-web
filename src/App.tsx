import { useEffect, useState } from "react";
import { get_teams, get_team_data, type TeamSummary } from "./api";
import { build_team_macros, sort_players, type SortBy } from "./macros";
import TeamPicker from "./TeamPicker";

export default function App() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [teamsError, setTeamsError] = useState(false);
  const [order, setOrder] = useState<SortBy>("name");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load the team list once on mount to populate the picker.
  useEffect(() => {
    get_teams()
      .then(setTeams)
      .catch((err) => {
        console.error("Failed to load teams", err);
        setTeamsError(true);
      });
  }, []);

  async function generate() {
    if (!team) return;
    setLoading(true);
    try {
      const data = await get_team_data(team);
      data.players = sort_players(data.players, order);
      setOutput(build_team_macros(data, code || undefined));
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function copyMacros() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>NHL Macros</h1>
        <p className="subtitle">
          Generate text-expansion macros for any NHL team's roster.
        </p>
      </header>

      <section className="card">
        <div className="field">
          <label htmlFor="chosen-team">Team</label>
          <TeamPicker teams={teams} value={team} onChange={setTeam} />
          {teamsError && (
            <span className="hint error">
              Couldn't load teams. Refresh the page to try again.
            </span>
          )}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="order">Order by</label>
            <select
              id="order"
              value={order}
              onChange={(e) => setOrder(e.target.value as SortBy)}
            >
              <option value="name">Last name</option>
              <option value="number">Number</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="code">Macro code</label>
            <input
              id="code"
              placeholder="e.g. v for \v"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <span className="hint">Defaults to first letter of the city.</span>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={generate}
          disabled={loading || !team}
        >
          {loading ? "Generating…" : "Generate Macros"}
        </button>
      </section>

      <section className="card">
        <div className="output-header">
          <span className="output-label">Output</span>
          <button
            className="btn btn-ghost"
            onClick={copyMacros}
            disabled={!output}
          >
            {copied ? "Copied!" : "Copy Text"}
          </button>
        </div>
        <textarea
          id="display-box"
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          placeholder="Your macros will appear here…"
          spellCheck={false}
        />
      </section>
    </main>
  );
}
