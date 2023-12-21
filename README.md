# nhl-macros-web

## Overview
!!!

## Features
- select your team, macro symbol, and ordering
- click to copy and you are ready to go!

## Tech Stack
- TypeScript, HTML, CSS, AWS

### Setup
- clone repo
- run "npm install" in main directory
- run "npm run build" 
- open index.html in dist folder to view
- edit index.ts in src
- edit index.html or styles.css in public

# installing packages to lambda:
- mkdir nodejs
- cd nodejs
- npm i axios
- rm -rf package-lock.json
- cd ..
- zip -r axios.zip nodejs

# deploying
- make sure URL has correct stage in frontend
- upload dist to s3 bucket
