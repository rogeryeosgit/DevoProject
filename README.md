# DevoProject

## Overview

This project is a culmination of my own technical learning over the last year or so. It is meant to move me from pen and paper journaling of my Quiet Times to being internet based.
It is also meant to make it easy for people who ever want to read a passage of scripture for devotion without the hassle of finding a book. You can find the final form at (<https://qt.navigators.tech>)

### Technical Stack

- [Vuetify](https://vuetifyjs.com/en/) - Vue UI Library based on [Material Design](https://material.io/design/introduction)
- [Nuxt](https://nuxtjs.org/) - Vue Framework that allowed me to do SSR
- [VueJS](https://vuejs.org/) - JS Framework for frontend
- [Node](https://nodejs.org/en/) - JS Runtime built on top of Chrome V8 engine
- [Express](https://expressjs.com/) - Web Application frame work for Node
- [MongoDB](https://www.mongodb.com/cloud/atlas) - Cloud hosted MongoDB database. AWS behind the scenes.
- [Firebase Auth](https://firebase.google.com/products/auth) - Simple free multiplatform sign in

### Extra Stuff

Don't suppose anyone would ever want to read it, but my thinking and work progress is documented in [Notes.md](Notes.md) along with some of the other repos in my github.
Project work progress can be seen in the github Projects Tab. Welcome comments for improvement and pull requests.

## Version 1.0 - 2 Sep 2020

> Features

- Authenticated access to Journal and Plans for personalization with Authorization checks
- Create, list, update, delete and select QT Plans
- Ability to write, list, update and delete QT journal entries
- Passages are obtained from chosen QT Plans and shown on the landing page
- Default passage comes from Proverbs

## Version 1.0.1 - 23 Sep 2020

- Updated site meta and visuals
- Resolved a number of bugs
- Journal entry creation and Plans creation now includes some validation to ensure fields are filled

## Version 1.0.2 - 26 Sep 2020

- Set up encryption for journal entries (I can't read them in plain text now...)
- Passages are cached for quick access
- Solved a reload bug for front page

## Version 1.0.3 - 23 May 2021

- Patched Pslams wrong number of verses bug
- Implemented reset password functionality

## Version 1.0.4 - 12 Feb 2022

- Updated to work with MongoDB 5.0
- Functionality to copy journal entries to clipboard

## Local Development Setup

The app is an Express + Nuxt server that only serves over HTTPS (even locally), and depends on MongoDB, Firebase Auth, and the ESV Bible API. None of this is configured out of the box — here's how to stand it up on your machine.

### Prerequisites

- Node.js + npm
- [Docker](https://www.docker.com/) (for a local MongoDB instance)
- OpenSSL (for a local TLS certificate — ships with macOS/Linux)
- Access to the project's Firebase console (to generate an Admin SDK service account key)

### 1. Install dependencies

```bash
npm install
```

### 2. Start a local MongoDB

```bash
docker compose up -d
```

This starts a `mongo` container on `localhost:27017` and seeds the `--- Default Nav Plan ---` document (see `docker/mongo-init.js`) that new-user registration and the "today's passage" route both depend on.

### 3. Generate a local TLS certificate

`server/index.js` reads `LOCAL_SSLKEY`/`LOCAL_SSLCERT` and refuses to start without them:

```bash
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout localhost-key.pem -out localhost.pem -days 825 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

Your browser will warn about the self-signed cert on first visit — that's expected, click through it.

### 4. Create a `.env` file

Copy the template below into a `.env` file at the repo root (loaded automatically in dev via `dotenv`):

```bash
MONGODB_ACCESS=mongodb://localhost:27017/qtapp
ESVAPI_KEY=<your ESV API key — free at https://api.esv.org>
MONGOOSE_SECRET=<any random string, e.g. `openssl rand -hex 32` — encrypts journal entries at rest>
CACHE_TTL=3600
LOCAL_SSLKEY=./localhost-key.pem
LOCAL_SSLCERT=./localhost.pem
BASE_URL=https://localhost:3000
BROWSER_BASE_URL=https://localhost:3000
```

To point the client at a different Firebase project than production (`qtapp-3b06e`) — e.g. a personal dev project — also set:

```bash
FIREBASE_API_KEY=<web app apiKey>
FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_STORAGE_BUCKET=<web app storageBucket>
FIREBASE_MESSAGING_SENDER_ID=<web app messagingSenderId>
FIREBASE_APP_ID=<web app appId>
```

These are read in `nuxt.config.js` and fall back to the production values when unset, so leaving them out targets production's Firebase project by default.

### 5. Add the Firebase Admin service account

`server/services/auth.js` requires `fb-service-account.json` at the repo root to verify auth tokens server-side. Generate one from the Firebase Console for whichever project you're targeting (must match the project behind `FIREBASE_PROJECT_ID` above):

Project Settings → Service Accounts → Generate new private key → save as `fb-service-account.json` in the repo root.

Both `.env` and `fb-service-account.json` are git-ignored — never commit them.

### 6. Run it

```bash
# serve with hot reload at https://localhost:3000
npm run dev

# build for production and launch server
npm run build
npm run start
```

### Logs

The server writes `logs/QTApp.log` (Singapore-time timestamps, one file per week, kept for a year). When a user reports an "Error ref: XXXXXX", find it with `grep XXXXXX logs/QTApp*.log`. Set `NUXT_LOG_LEVEL=debug` in `.env` for more detail locally. See the Logging section of `CLAUDE.md` for everything that's logged and the settings.

Created using Nuxt, check out [Nuxt.js docs](https://nuxtjs.org).
