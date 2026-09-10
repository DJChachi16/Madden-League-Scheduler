import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { discord_user_id, week } = req.body || {};

    if (!discord_user_id) {
      return res.status(400).json({
        error: "Missing Discord user ID"
      });
    }

    if (!week) {
      return res.status(400).json({
        error: "Missing week"
      });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    // Find the logged-in OGML owner
    const { data: member, error: memberError } = await supabase
      .from("league_members")
      .select("id, discord_username, team_name, team_abbr")
      .eq("discord_user_id", discord_user_id)
      .eq("is_active", true)
      .single();

    if (memberError || !member) {
      console.error("Member lookup failed:", memberError);

      return res.status(404).json({
        error: "League member not found"
      });
    }

    // Find the active OGML season
    const { data: season, error: seasonError } = await supabase
      .from("seasons")
      .select("id, name")
      .eq("name", "OGML 2026")
      .eq("is_active", true)
      .single();

    if (seasonError || !season) {
      console.error("Season lookup failed:", seasonError);

      return res.status(404).json({
        error: "Active season not found"
      });
    }

    // Find this owner's matchup for the requested week
    const { data: matchup, error: matchupError } = await supabase
      .from("matchups")
      .select(
        "id, week, away_member_id, home_member_id, status, scheduled_at, notes"
      )
      .eq("season_id", season.id)
      .eq("week", Number(week))
      .or(
        `away_member_id.eq.${member.id},home_member_id.eq.${member.id}`
      )
      .single();

    if (matchupError || !matchup) {
      console.error("Matchup lookup failed:", matchupError);

      return res.status(404).json({
        error: `No Week ${week} matchup found`
      });
    }

    const userIsAway =
      matchup.away_member_id === member.id;

    const opponentId = userIsAway
      ? matchup.home_member_id
      : matchup.away_member_id;

    // Get the opponent/owner
    const { data: opponent, error: opponentError } = await supabase
      .from("league_members")
      .select("id, discord_username, team_name, team_abbr")
      .eq("id", opponentId)
      .single();

    if (opponentError || !opponent) {
      console.error("Opponent lookup failed:", opponentError);

      return res.status(404).json({
        error: "Opponent not found"
      });
    }

    return res.status(200).json({
      matchup: {
        id: matchup.id,
        week: matchup.week,
        status: matchup.status,
        scheduled_at: matchup.scheduled_at,
        notes: matchup.notes,
        user_is_away: userIsAway,
        user: member,
        opponent
      }
    });
  } catch (error) {
    console.error("Matchup API error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
