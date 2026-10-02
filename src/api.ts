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
  headCoach?: string;
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

  const [roster, headCoach] = await Promise.all([
    fetch(`${PROD_URL}/roster?tricode=${match.triCode}`).then((r) => r.json()),
    get_head_coach(match.triCode),
  ]);

  const players: Player[] = [
    ...roster.forwards,
    ...roster.defensemen,
    ...roster.goalies,
  ];

  return { name, players, headCoach };
}

// Fetches the team's current head coach. Non-fatal: returns undefined on any
// failure so the rest of the macros still generate.
export async function get_head_coach(triCode: string): Promise<string | undefined> {
  try {
    const response = await fetch(`${PROD_URL}/getCoach?tricode=${triCode}`);
    let parsed = await response.json();
    // Unwrap if API Gateway passes the lambda's proxy-style response through as-is.
    if (typeof parsed.body === "string") parsed = JSON.parse(parsed.body);
    return parsed.headCoach ?? undefined;
  } catch (err) {
    console.warn("Failed to load head coach", err);
    return undefined;
  }
}
