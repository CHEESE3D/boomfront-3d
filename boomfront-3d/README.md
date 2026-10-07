# 💥 BOOMFRONT 3D — GitHub Pages + Railway

A browser 3D multiplayer arena shooter.

## What is included

- Proper first-person camera and mouse aim
- WASD movement + sprint
- Assault rifle
- SMG
- Shotgun with pellets
- Sniper
- Rocket launcher with server-side explosions
- Plasma cannon
- Grenades
- Drivable/boostable vehicle mode
- Multiple procedural maps
- Map voting
- Team Deathmatch teams
- Respawns
- Kill streak tracking
- Quick Match
- Public lobby browser
- Specific/private lobby codes
- Server-side projectile simulation and damage
- GitHub Pages deployment workflow
- Railway deployment config

## The important deployment idea

**GitHub Pages:** hosts `client/`, the actual 3D website/game.

**Railway:** runs `server/server.js`, the multiplayer server.

The browser connects from GitHub Pages to the Railway URL.

## STEP 1 — Create the GitHub repository

Create a public repository named `boomfront-3d`.

Upload the contents of this folder, not the ZIP itself.

You should see:

```text
boomfront-3d/
├── .github/
│   └── workflows/
│       └── pages.yml
├── client/
│   ├── index.html
│   └── config.js
├── server/
│   └── server.js
├── package.json
├── railway.json
├── .env.example
└── README.md
```

## STEP 2 — Deploy the multiplayer server to Railway

Go to Railway and create a project.

Choose:

**New Project → Deploy from GitHub repo**

Select `boomfront-3d`.

Railway should detect the Node project automatically.

The start command is already configured:

```bash
npm start
```

After deployment:

**Service → Settings → Networking → Generate Domain**

You will get an HTTPS address similar to:

```text
https://boomfront-3d-production.up.railway.app
```

## STEP 3 — Allow your GitHub Pages site

In Railway, open your service's **Variables** tab and add:

```text
CLIENT_ORIGIN=https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

Example:

```text
CLIENT_ORIGIN=https://alex.github.io/boomfront-3d/
```

Then deploy the staged Railway changes.

## STEP 4 — Connect the game to Railway

Open:

```text
client/config.js
```

Change:

```js
window.BF_SERVER_URL = "https://YOUR-RAILWAY-DOMAIN";
```

to your real Railway URL:

```js
window.BF_SERVER_URL = "https://boomfront-3d-production.up.railway.app";
```

Commit/push that change to GitHub.

## STEP 5 — Turn on GitHub Pages

On GitHub:

**Repository → Settings → Pages**

Under **Build and deployment**, set:

**Source → GitHub Actions**

GitHub will run `.github/workflows/pages.yml`.

The workflow publishes the contents of `client/`, so `client/index.html` becomes the website root.

Your game will be at:

```text
https://YOUR-USERNAME.github.io/boomfront-3d/
```

GitHub says Pages deployments can use a custom GitHub Actions workflow, and pushes to the default branch can automatically redeploy the site.

## STEP 6 — Play

Open your GitHub Pages URL.

Two people can open it at the same time.

One player can create a lobby and give the other player its code.

Or both can use:

**QUICK MATCH**

## If the game says "Set your Railway URL"

You haven't changed `client/config.js` yet.

## If the game loads but multiplayer does not work

Check:

1. Railway deployment is running.
2. Railway has a generated public domain.
3. `client/config.js` contains that exact HTTPS domain.
4. Railway has `CLIENT_ORIGIN` set to your exact GitHub Pages origin.
5. Push the changed `config.js` to GitHub.
6. Wait for the GitHub Actions Pages deployment to finish.
7. Hard-refresh the game.

## Local testing

Install Node.js 18+:

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

For local testing without GitHub Pages, temporarily change `client/config.js` to:

```js
window.BF_SERVER_URL = "http://localhost:3000";
```

## Controls

- WASD — move
- Mouse — look/aim
- Left click — fire
- 1 — assault rifle
- 2 — SMG
- 3 — shotgun
- 4 — sniper
- 5 — rocket launcher
- 6 — plasma
- G — grenade
- E — enter/exit vehicle
- Shift — sprint/vehicle boost
- Tab — scoreboard
- Esc — release mouse

## Note

This is an asset-free prototype. It deliberately uses procedural geometry and WebAudio so the project is easy to publish without a huge asset folder.

For a production game, the next improvements would be persistent accounts, authoritative movement/anti-cheat, better vehicle physics, polished maps, real 3D models, animations, matchmaking queues, parties, sound assets, and server scaling.
