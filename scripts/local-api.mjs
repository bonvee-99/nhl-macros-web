// Runs the real lambda handlers behind a tiny local HTTP server, mimicking
// API Gateway's proxy integration. No dependencies needed.
//   npm run dev:api   ->  http://localhost:3000/teams, /roster?tricode=VAN, /coach?tricode=VAN

import http from "node:http";
import { handler as teams } from "../lambdas/teams.mjs";
import { handler as roster } from "../lambdas/roster.mjs";
import { handler as coach } from "../lambdas/coach.mjs";

const routes = { "/teams": teams, "/roster": roster, "/coach": coach };
const port = Number(process.env.PORT ?? 3000);

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const handler = req.method === "GET" && routes[url.pathname];
    if (!handler) {
      res.writeHead(404, { "Access-Control-Allow-Origin": "*" }).end('{"message":"Not Found"}');
      return;
    }

    const event = { queryStringParameters: Object.fromEntries(url.searchParams) };
    const result = await handler(event);
    res.writeHead(result.statusCode, result.headers).end(result.body);
    console.log(`${req.method} ${req.url} -> ${result.statusCode}`);
  })
  .listen(port, () => console.log(`Local API at http://localhost:${port}`));
