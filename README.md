# OGML Madden Scheduler — Version 0.1

This is the first deployable prototype of the OGML Madden Scheduler Discord Activity.

## What works now

- Responsive OGML scheduling interface
- Weekly matchup card
- Propose time
- Quick-pick time
- Accept / counter / decline demo workflow
- Confirmed-game board
- Discord Embedded App SDK initialization
- Works as a normal browser preview while you are building

**Important:** Version 0.1 stores data only in the page while it is open. It does not yet sync schedules between different league members. The next build will add real Discord authentication and a shared database.

## Deploy to Vercel — easiest path

### 1. Put this project on GitHub
Create a new GitHub repository named `ogml-madden-scheduler`, then upload all files from this folder.

### 2. Import it into Vercel
In Vercel choose **Add New → Project**, import the GitHub repo, and let Vercel detect Vite.

Build command:
`npm run build`

Output directory:
`dist`

### 3. Add the environment variable
In Vercel → Project Settings → Environment Variables add:

`VITE_DISCORD_CLIENT_ID` = `1546241968214909070`

Then redeploy.

### 4. Copy your Vercel domain
It will look similar to:

`https://ogml-madden-scheduler.vercel.app`

### 5. Return to Discord Developer Portal
Go to:

Activities → URL Mappings

Set:

Prefix: `/`

Target: your Vercel domain

Save changes.

Then return to:

Activities → Settings

and enable Activities.

## Run locally (optional)

Install Node.js, then:

`npm install`
`npm run dev`

Open the local address Vite prints.

## Version 0.2 plan

- Discord OAuth identity
- Map Discord users to Madden teams
- Shared Supabase database
- Real propose / accept / counter workflow between two owners
- Commissioner dashboard
- Discord channel confirmation posts
- Reminders before kickoff
