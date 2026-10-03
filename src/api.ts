// API layer for the NHL macros app.
// Defaults to the prod API Gateway (output `api_url` from infra/). Set
// VITE_API_URL to point elsewhere, e.g. `npm run dev:local` uses the local API.

const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://enrv4o2ij1.execute-api.us-west-1.amazonaws.com";

export interface Player {
  sweaterNumber: string;
  firstName: { default: string };
  lastName: { default: string };
}

export interface Team {
  name: string;
  players: Player[];
  headCoach?: string;
}

export interface TeamSummary {
  fullName: string;
  triCode: string;
  logo: string;
  division: string;
  conference: string;
}

// Fetches the current 32 teams (used for the team picker).
export async function get_teams(): Promise<TeamSummary[]> {
  const response = await fetch(`${API_URL}/teams`);
  if (!response.ok) throw new Error(`Failed to load teams (HTTP ${response.status})`);
  return (await response.json()) as TeamSummary[];
}

// Fetches roster data and head coach for the given team.
export async function get_team_data(team: TeamSummary): Promise<Team> {
  const [roster, headCoach] = await Promise.all([
    fetch(`${API_URL}/roster?tricode=${team.triCode}`).then((r) => r.json()),
    get_head_coach(team.triCode),
  ]);

  const players: Player[] = [
    ...roster.forwards,
    ...roster.defensemen,
    ...roster.goalies,
  ];

  return { name: team.fullName, players, headCoach };
}

// Fetches the team's current head coach. Non-fatal: returns undefined on any
// failure so the rest of the macros still generate.
export async function get_head_coach(triCode: string): Promise<string | undefined> {
  try {
    const response = await fetch(`${API_URL}/coach?tricode=${triCode}`);
    const parsed = await response.json();
    return parsed.headCoach ?? undefined;
  } catch (err) {
    console.warn("Failed to load head coach", err);
    return undefined;
  }
}
