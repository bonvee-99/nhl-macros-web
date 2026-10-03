// GET /teams -> [{ fullName, triCode, logo, division, conference }]
// Uses the standings endpoint because it lists exactly the current 32 teams
// (the stats team endpoint also includes defunct franchises) and has logos.
// Uses the built-in fetch (Node 18+), so no axios layer is needed.

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler = async () => {
  try {
    const res = await fetch("https://api-web.nhle.com/v1/standings/now");
    if (!res.ok) throw new Error(`NHL API -> HTTP ${res.status}`);
    const { standings } = await res.json();

    const teams = standings
      .map((t) => ({
        fullName: t.teamName.default,
        triCode: t.teamAbbrev.default,
        // Dark variant is drawn for dark backgrounds, which matches the app.
        logo: t.teamLogo.replace("_light.svg", "_dark.svg"),
        division: t.divisionName,
        conference: t.conferenceName,
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));

    return { statusCode: 200, headers, body: JSON.stringify(teams) };
  } catch (err) {
    console.error(err);
    return { statusCode: 502, headers, body: JSON.stringify({ error: "Failed to fetch teams from NHL API" }) };
  }
};
