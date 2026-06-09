// API layer for the NHL macros app.
// Talks to the prod API Gateway directly — CORS is enabled there, so this
// works the same in local dev and in the deployed S3 build.

const PROD_URL = "https://0d27ux40wd.execute-api.us-west-1.amazonaws.com/prod";

export interface Player {
  sweaterNumber: string;
  firstName: { default: string };
  lastName: { default: string };
}

export interface Team {
  name: string;
  players: Player[];
}

interface TeamSummary {
  fullName: string;
  triCode: string;
}

// Fetches the full list of teams (used for the team picker).
export async function get_teams(): Promise<TeamSummary[]> {
  const response = await fetch(`${PROD_URL}/teams`);
  const parsed = await response.json();
  // The lambda returns a proxy-style response with a JSON string `body`.
  return JSON.parse(parsed.body) as TeamSummary[];
}

// Fetches roster data for a team given its full display name.
export async function get_team_data(name: string): Promise<Team> {
  const teams = await get_teams();
  const match = teams.find((t) => t.fullName === name);
  if (!match) {
    throw new Error("No team with the given name");
  }

  const response = await fetch(`${PROD_URL}/roster?tricode=${match.triCode}`);
  const roster = await response.json();

  const players: Player[] = [
    ...roster.forwards,
    ...roster.defensemen,
    ...roster.goalies,
  ];

  return { name, players };
}
