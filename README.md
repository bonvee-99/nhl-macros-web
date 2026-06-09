# nhl-macros-web

## [See live](https://bonvee-nhl-macros.s3.us-west-1.amazonaws.com/dist/index.html)

## Features
- select your team, macro symbol, and ordering
- click to copy and you are ready to go!

## Tech Stack
- React, TypeScript, Vite, AWS (Lambda + API Gateway + S3)

### Local development
- `npm install`
- `npm run dev` — starts the Vite dev server (hot reload) at http://localhost:5173
  - The app talks directly to the prod API Gateway, so no local backend is needed.

### Source layout (`src/`)
- `App.tsx` — UI and state
- `api.ts` — fetches teams/roster from the API
- `macros.ts` — sorting + macro-string generation
- `styles.css` — styling

# installing packages to lambda:
- mkdir nodejs
- cd nodejs
- npm i axios
- rm -rf package-lock.json
- cd ..
- zip -r axios.zip nodejs

# deploying
- make sure the API URL has the correct stage in `src/api.ts`
- `npm run build` — outputs the static site to `dist/`
- upload the contents of `dist/` to the S3 bucket
