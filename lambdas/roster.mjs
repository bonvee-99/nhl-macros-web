// GET /roster?tricode=VAN -> { forwards, defensemen, goalies }
// Uses the built-in fetch (Node 18+), so no axios layer is needed.

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function respond(statusCode, data) {
  return { statusCode, headers, body: JSON.stringify(data) };
}

export const handler = async (event) => {
  const tricode = (event?.queryStringParameters?.tricode ?? "").toUpperCase();
  if (!/^[A-Z]{3}$/.test(tricode)) {
    return respond(400, { error: "tricode query param is required, e.g. ?tricode=VAN" });
  }

  try {
    const res = await fetch(`https://api-web.nhle.com/v1/roster/${tricode}/current`);
    if (!res.ok) throw new Error(`NHL API -> HTTP ${res.status}`);
    return respond(200, await res.json());
  } catch (err) {
    console.error(err);
    return respond(502, { error: "Failed to fetch roster from NHL API" });
  }
};
