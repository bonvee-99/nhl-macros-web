// GET /coach?tricode=VAN -> { headCoach: "Adam Foote" }
// The NHL roster endpoint doesn't include coaches, but each game's right-rail
// does. So we find the team's most recent finished game and read it from there.
// Uses the built-in fetch (Node 18+), so no axios layer is needed.

const NHL = "https://api-web.nhle.com/v1";
const FINISHED = new Set(["FINAL", "OFF"]);
const REGULAR_OR_PLAYOFF = new Set([2, 3]);

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function respond(statusCode, data) {
  return { statusCode, headers, body: JSON.stringify(data) };
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

// Most recent finished game, preferring regular season/playoffs over preseason.
function latestFinishedGame(games) {
  const finished = games.filter((g) => FINISHED.has(g.gameState));
  const real = finished.filter((g) => REGULAR_OR_PLAYOFF.has(g.gameType));
  const pool = real.length ? real : finished;
  return pool[pool.length - 1];
}

function previousSeason(season) {
  // 20262027 -> 20252026
  const start = Math.floor(season / 10000) - 1;
  return `${start}${start + 1}`;
}

export async function findHeadCoach(tricode) {
  const current = await getJson(`${NHL}/club-schedule-season/${tricode}/now`);
  let game = latestFinishedGame(current.games ?? []);

  // Before the season's first game, fall back to last season.
  if (!game && current.currentSeason) {
    const prev = await getJson(
      `${NHL}/club-schedule-season/${tricode}/${previousSeason(current.currentSeason)}`,
    );
    game = latestFinishedGame(prev.games ?? []);
  }
  if (!game) return null;

  const rail = await getJson(`${NHL}/gamecenter/${game.id}/right-rail`);
  const side = game.homeTeam?.abbrev === tricode ? "homeTeam" : "awayTeam";
  return rail.gameInfo?.[side]?.headCoach?.default ?? null;
}

export const handler = async (event) => {
  // Works with both Lambda proxy integration and a non-proxy mapping template.
  const tricode = (event?.queryStringParameters?.tricode ?? event?.tricode ?? "")
    .toUpperCase();
  if (!/^[A-Z]{3}$/.test(tricode)) {
    return respond(400, { error: "tricode query param is required, e.g. ?tricode=VAN" });
  }

  try {
    const headCoach = await findHeadCoach(tricode);
    if (!headCoach) return respond(404, { error: `No coach found for ${tricode}` });
    return respond(200, { headCoach });
  } catch (err) {
    console.error(err);
    return respond(502, { error: "Failed to fetch coach from NHL API" });
  }
};
