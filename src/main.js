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
  week: 1,
  userTeam: "Loading...",
  userAbbr: "---",
  userCoach: "Loading...",
  opponentTeam: "Loading...",
  opponentAbbr: "---",
  opponentCoach: "Loading...",
  userIsAway: true,
  status: "Loading matchup...",
  proposal: null,
  confirmed: []
};

function esc(s = "") {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function prettyTime(v) {
  const [h, m] = v.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);

  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
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

        <div id="discord-pill" class="discord-pill">
          Connecting to Discord…
        </div>
      </header>

      <main class="grid">
        <section class="card matchup-card">
          <div class="eyebrow">
            WEEK ${state.week} • USER GAME
          </div>

          <div class="matchup-top">
            <h2>
              ${esc(state.userTeam)} vs ${esc(state.opponentTeam)}
            </h2>

            <span class="status">
              ${esc(state.status)}
            </span>
          </div>

          <div class="teams">
            <div class="team">
              <div class="abbr">
                ${state.userAbbr}
              </div>

              <div>
                ${esc(state.userCoach)}
              </div>
            </div>

            <div class="versus">
              <span>MATCHUP</span>
              <strong>@ ${state.opponentAbbr}</strong>
            </div>

            <div class="team">
              <div class="abbr">
                ${state.opponentAbbr}
              </div>

              <div>
                ${esc(state.opponentCoach)}
              </div>
            </div>
          </div>

          <form id="schedule-form" class="form">
            <label>
              Day

              <select id="day">
                ${[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday"
                ]
                  .map(d => `<option>${d}</option>`)
                  .join("")}
              </select>
            </label>

            <label>
              Time

              <input
                id="time"
                type="time"
                value="20:30"
                required
              />
            </label>

            <label class="wide">
              Note to opponent

              <input
                id="note"
                maxlength="80"
                placeholder="I can play after the Lions game"
              />
            </label>

            <div class="actions wide">
              <button
                class="primary"
                type="submit"
              >
                Propose Time
              </button>

              <button
                id="quick"
                type="button"
              >
                Quick Pick: Tonight 9 PM
              </button>
            </div>
          </form>
        </section>

        <section class="card response-card">
          <div class="eyebrow">
            OPPONENT RESPONSE
          </div>

          <h3>
            ${
              proposal
                ? `${esc(proposal.day)} • ${prettyTime(proposal.time)} ET`
                : "No proposal yet"
            }
          </h3>

          <p>
            ${
              proposal
                ? esc(
                    proposal.note ||
                    "Waiting for opponent response."
                  )
                : "Choose a time to send the matchup request."
            }
          </p>

          <div class="stack">
            <button
              id="accept"
              class="primary"
              ${proposal ? "" : "disabled"}
            >
              Accept
            </button>

            <button
              id="counter"
              ${proposal ? "" : "disabled"}
            >
              Counter Offer
            </button>

            <button
              id="decline"
              ${proposal ? "" : "disabled"}
            >
              Can’t Make It
            </button>
          </div>

          <div
            id="message"
            class="message"
            aria-live="polite"
          ></div>
        </section>

        <section class="card schedule-board">
          <div class="board-head">
            <div>
              <div class="eyebrow">
                CONFIRMED GAMES
              </div>

              <h3>League Schedule Board</h3>
            </div>

            <span>Eastern Time</span>
          </div>

          <div class="games">
            ${state.confirmed
              .map(
                g => `
                  <article class="game">
                    <strong>
                      ${esc(g.matchup)}
                    </strong>

                    <span>
                      ${esc(g.when)}
                    </span>

                    <small>
                      ✅ Confirmed
                    </small>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="stats">
          <div>
            <span>Scheduled</span>

            <strong>
              ${
                state.confirmed.length +
                (state.status.includes("Confirmed") ? 1 : 0)
              }
            </strong>
          </div>

          <div>
            <span>Waiting</span>

            <strong>
              ${
                state.proposal &&
                !state.status.includes("Confirmed")
                  ? 1
                  : 3
              }
            </strong>
          </div>

          <div>
            <span>Completed</span>
            <strong>5</strong>
          </div>

          <div>
            <span>Deadline</span>

            <strong class="deadline">
              Sunday 11:59 PM
            </strong>
          </div>
        </section>
      </main>

      <footer>
        OGML • Prototype v0.1 • ${
          clientId
            ? "Discord application configured"
            : "Add your Discord Client ID"
        }
      </footer>
    </div>
  `;

  attachEvents();
}

function attachEvents() {
  document
    .querySelector("#schedule-form")
    .addEventListener("submit", e => {
      e.preventDefault();

      state.proposal = {
        day: document.querySelector("#day").value,
        time: document.querySelector("#time").value,
        note: document
          .querySelector("#note")
          .value.trim()
      };

      state.status = "Pending opponent";

      render();

      setMessage(
        "Proposal created. In the connected version, your opponent will be notified in Discord."
      );
    });

  document
    .querySelector("#quick")
    .addEventListener("click", () => {
      state.proposal = {
        day: "Sunday",
        time: "21:00",
        note: ""
      };

      state.status = "Pending opponent";

      render();

      setMessage(
        "Sunday at 9:00 PM ET proposed."
      );
    });

  document
    .querySelector("#accept")
    .addEventListener("click", () => {
      if (!state.proposal) return;

      const when =
        `${state.proposal.day} • ` +
        `${prettyTime(state.proposal.time)} ET`;

      state.confirmed.unshift({
        matchup:
          `${state.userTeam} vs ${state.opponentTeam}`,
        when
      });

      state.status = "✅ Confirmed";
      state.proposal = null;

      render();

      setMessage(
        "Game confirmed! Next version will post this automatically to your Discord channel."
      );
    });

  document
    .querySelector("#counter")
    .addEventListener("click", () => {
      if (!state.proposal) return;

      const [h, m] =
        state.proposal.time
          .split(":")
          .map(Number);

      state.proposal.time =
        `${String(Math.min(23, h + 1)).padStart(2, "0")}:` +
        `${String(m).padStart(2, "0")}`;

      state.status = "Counter offered";

      render();

      setMessage(
        "Counter offer moved one hour later."
      );
    });

  document
    .querySelector("#decline")
    .addEventListener("click", () => {
      state.status = "Needs new time";
      state.proposal = null;

      render();

      setMessage(
        "That time was declined. Send another proposal."
      );
    });
}

function setMessage(text) {
  const el =
    document.querySelector("#message");

  if (el) {
    el.textContent = text;
  }
}

async function initDiscord() {
  const pill =
    document.querySelector("#discord-pill");

  if (!clientId) {
    pill.textContent = "Browser Preview";
    return;
  }

  try {
    discordSdk =
      new DiscordSDK(clientId);

    await discordSdk.ready();

    const { code } =
      await discordSdk.commands.authorize({
        client_id: clientId,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: ["identify"]
      });

    const tokenResponse =
      await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({ code })
      });

    let tokenData;

    try {
      tokenData =
        await tokenResponse.json();
    } catch {
      throw new Error(
        `Token endpoint returned an invalid response (${tokenResponse.status}).`
      );
    }

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

    const { access_token } =
      tokenData;

    if (!access_token) {
      throw new Error(
        "Discord did not return an access token."
      );
    }

    const auth =
      await discordSdk.commands.authenticate({
        access_token
      });

    if (!auth) {
      throw new Error(
        "Discord authentication failed."
      );
    }

    console.log(
      "Discord user:",
      auth.user
    );

    const memberResponse =
      await fetch("/api/member", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          discord_user_id: auth.user.id
        })
      });

    let memberData;

    try {
      memberData =
        await memberResponse.json();
    } catch {
      throw new Error(
        `Member endpoint returned an invalid response (${memberResponse.status}).`
      );
    }

    if (!memberResponse.ok) {
      throw new Error(
        memberData.error ||
        "Could not find this user in the OGML league."
      );
    }

   const member = memberData.member;

console.log("OGML member:", member);

// Load this user's REAL Week 1 matchup
const matchupResponse = await fetch("/api/matchup", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    discord_user_id: auth.user.id,
    week: 1
  })
});

let matchupData;

try {
  matchupData = await matchupResponse.json();
} catch {
  throw new Error(
    `Matchup endpoint returned an invalid response (${matchupResponse.status}).`
  );
}

if (!matchupResponse.ok) {
  throw new Error(
    matchupData.error ||
    `Could not load Week 1 matchup (${matchupResponse.status}).`
  );
}

const matchup = matchupData.matchup;

console.log("OGML matchup:", matchup);

state.week = matchup.week;

state.userTeam = matchup.user.team_name;
state.userAbbr = matchup.user.team_abbr;
state.userCoach = matchup.user.discord_username;

state.opponentTeam = matchup.opponent.team_name;
state.opponentAbbr = matchup.opponent.team_abbr;
state.opponentCoach = matchup.opponent.discord_username;

state.userIsAway = matchup.user_is_away;

state.status =
  matchup.status === "unscheduled"
    ? "Not scheduled"
    : matchup.status;

render();
    const updatedPill =
      document.querySelector("#discord-pill");

    updatedPill.textContent =
      `✓ ${member.discord_username}`;

    updatedPill.classList.add(
      "connected"
    );

    setMessage(
      `Signed in as ${member.discord_username} • ${member.team_name}`
    );
  } catch (err) {
    console.error(
      "Discord authentication error:",
      err
    );

    const currentPill =
      document.querySelector("#discord-pill");

    if (currentPill) {
      currentPill.textContent =
        "Discord Login Error";
    }

    setMessage(
      `Discord error: ${
        err?.message || err
      }`
    );
  }
}

render();
initDiscord();
