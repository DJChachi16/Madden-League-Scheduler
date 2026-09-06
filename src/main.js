import "./style.css";
import { DiscordSDK } from "@discord/embedded-app-sdk";
import { createClient } from "@supabase/supabase-js";

const clientId =
  import.meta.env.VITE_DISCORD_CLIENT_ID || "1546241968214909070";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);

let discordSdk = null;

const state = {
  week: 4,
  userTeam: "Miami Dolphins",
  userAbbr: "MIA",
  userCoach: "Brett",
  opponentTeam: "Pittsburgh Steelers",
  opponentAbbr: "PIT",
  opponentCoach: "Ashley",
  status: "Not scheduled",
  proposal: null,
  confirmed: [
    { matchup: "Cowboys vs Eagles", when: "Tuesday • 7:30 PM ET" },
    { matchup: "Lions vs Packers", when: "Wednesday • 9:00 PM ET" },
    { matchup: "Ravens vs Bengals", when: "Thursday • 8:15 PM ET" }
  ]
};

function esc(s="") {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function prettyTime(v) {
  const [h,m] = v.split(":").map(Number);
  const d = new Date(2000,0,1,h,m);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function render() {
  const app = document.querySelector("#app");
  const proposal = state.proposal;
  app.innerHTML = `
    <div class="shell">
      <header class="hero">
        <div class="brand">
          <div class="badge">OGML</div>
          <div>
            <h1>Madden Scheduler</h1>
            <p>Official league game scheduling hub</p>
          </div>
        </div>
        <div id="discord-pill" class="discord-pill">Connecting to Discord…</div>
      </header>

      <main class="grid">
        <section class="card matchup-card">
          <div class="eyebrow">WEEK ${state.week} • USER GAME</div>
          <div class="matchup-top">
            <h2>${esc(state.userTeam)} vs ${esc(state.opponentTeam)}</h2>
            <span class="status">${esc(state.status)}</span>
          </div>

          <div class="teams">
            <div class="team">
              <div class="abbr">${state.userAbbr}</div>
              <div>${esc(state.userCoach)}</div>
            </div>
            <div class="versus">
              <span>MATCHUP</span>
              <strong>@ ${state.opponentAbbr}</strong>
            </div>
            <div class="team">
              <div class="abbr">${state.opponentAbbr}</div>
              <div>${esc(state.opponentCoach)}</div>
            </div>
          </div>

          <form id="schedule-form" class="form">
            <label>Day
              <select id="day">
                ${["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => `<option>${d}</option>`).join("")}
              </select>
            </label>
            <label>Time
              <input id="time" type="time" value="20:30" required />
            </label>
            <label class="wide">Note to opponent
              <input id="note" maxlength="80" placeholder="I can play after the Lions game" />
            </label>
            <div class="actions wide">
              <button class="primary" type="submit">Propose Time</button>
              <button id="quick" type="button">Quick Pick: Tonight 9 PM</button>
            </div>
          </form>
        </section>

        <section class="card response-card">
          <div class="eyebrow">OPPONENT RESPONSE</div>
          <h3>${proposal ? `${esc(proposal.day)} • ${prettyTime(proposal.time)} ET` : "No proposal yet"}</h3>
          <p>${proposal ? esc(proposal.note || "Waiting for opponent response.") : "Choose a time to send the matchup request."}</p>
          <div class="stack">
            <button id="accept" class="primary" ${proposal ? "" : "disabled"}>Accept</button>
            <button id="counter" ${proposal ? "" : "disabled"}>Counter Offer</button>
            <button id="decline" ${proposal ? "" : "disabled"}>Can’t Make It</button>
          </div>
          <div id="message" class="message" aria-live="polite"></div>
        </section>

        <section class="card schedule-board">
          <div class="board-head">
            <div>
              <div class="eyebrow">CONFIRMED GAMES</div>
              <h3>League Schedule Board</h3>
            </div>
            <span>Eastern Time</span>
          </div>
          <div class="games">
            ${state.confirmed.map(g => `
              <article class="game">
                <strong>${esc(g.matchup)}</strong>
                <span>${esc(g.when)}</span>
                <small>✅ Confirmed</small>
              </article>`).join("")}
          </div>
        </section>

        <section class="stats">
          <div><span>Scheduled</span><strong>${state.confirmed.length + (state.status.includes("Confirmed") ? 1 : 0)}</strong></div>
          <div><span>Waiting</span><strong>${state.proposal && !state.status.includes("Confirmed") ? 1 : 3}</strong></div>
          <div><span>Completed</span><strong>5</strong></div>
          <div><span>Deadline</span><strong class="deadline">Sunday 11:59 PM</strong></div>
        </section>
      </main>

      <footer>
        OGML • Prototype v0.1 • ${clientId ? "Discord application configured" : "Add your Discord Client ID"}
      </footer>
    </div>
  `;

  attachEvents();
}

function attachEvents() {
  document.querySelector("#schedule-form").addEventListener("submit", (e) => {
    e.preventDefault();
    state.proposal = {
      day: document.querySelector("#day").value,
      time: document.querySelector("#time").value,
      note: document.querySelector("#note").value.trim()
    };
    state.status = "Pending opponent";
    render();
    setMessage("Proposal created. In the connected version, your opponent will be notified in Discord.");
  });

  document.querySelector("#quick").addEventListener("click", () => {
    state.proposal = { day: "Sunday", time: "21:00", note: "" };
    state.status = "Pending opponent";
    render();
    setMessage("Sunday at 9:00 PM ET proposed.");
  });

  document.querySelector("#accept").addEventListener("click", () => {
    if (!state.proposal) return;
    const when = `${state.proposal.day} • ${prettyTime(state.proposal.time)} ET`;
    state.confirmed.unshift({ matchup: `${state.userTeam} vs ${state.opponentTeam}`, when });
    state.status = "✅ Confirmed";
    state.proposal = null;
    render();
    setMessage("Game confirmed! Next version will post this automatically to your Discord channel.");
  });

  document.querySelector("#counter").addEventListener("click", () => {
    if (!state.proposal) return;
    const [h,m] = state.proposal.time.split(":").map(Number);
    state.proposal.time = `${String(Math.min(23,h+1)).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    state.status = "Counter offered";
    render();
    setMessage("Counter offer moved one hour later.");
  });

  document.querySelector("#decline").addEventListener("click", () => {
    state.status = "Needs new time";
    state.proposal = null;
    render();
    setMessage("That time was declined. Send another proposal.");
  });
}

function setMessage(text) {
  const el = document.querySelector("#message");
  if (el) el.textContent = text;
}

async function initDiscord() {
  const pill = document.querySelector("#discord-pill");

  if (!clientId) {
    pill.textContent = "Browser Preview";
    return;
  }

  try {
    // Start Discord SDK
    discordSdk = new DiscordSDK(clientId);
    await discordSdk.ready();

    // Ask Discord for permission to identify the user
    const { code } = await discordSdk.commands.authorize({
      client_id: clientId,
      response_type: "code",
      state: "",
      prompt: "none",
      scope: ["identify"],
    });

       
   

      // Send the temporary code to our secure Vercel backend
    const tokenResponse = await fetch("/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(
        `Token exchange failed (${tokenResponse.status}): ${
          tokenData.details ||
          tokenData.error_description ||
          tokenData.error ||
          "Unknown error"
        }`
      );
    }

    const { access_token } = tokenData;
initDiscord();

        // Authenticate this Discord user inside the Activity
