import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      discord_user_id,
      matchup_id,
      proposed_time,
      note
    } = req.body || {};

    if (!discord_user_id) {
      return res.status(400).json({
        error: "Missing Discord user ID"
      });
    }

    if (!matchup_id) {
      return res.status(400).json({
        error: "Missing matchup ID"
      });
    }

    if (!proposed_time) {
      return res.status(400).json({
        error: "Missing proposed time"
      });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    // Find the logged-in league member
    const { data: member, error: memberError } = await supabase
      .from("league_members")
      .select("id, discord_username, team_name, team_abbr")
      .eq("discord_user_id", discord_user_id)
      .eq("is_active", true)
      .single();

    if (memberError || !member) {
      console.error("Proposal member lookup failed:", memberError);

      return res.status(404).json({
        error: "League member not found"
      });
    }

    // Confirm this member belongs to the matchup
    const { data: matchup, error: matchupError } = await supabase
      .from("matchups")
      .select("id, away_member_id, home_member_id, status")
      .eq("id", matchup_id)
      .single();

    if (matchupError || !matchup) {
      console.error("Proposal matchup lookup failed:", matchupError);

      return res.status(404).json({
        error: "Matchup not found"
      });
    }

    const belongsToMatchup =
      matchup.away_member_id === member.id ||
      matchup.home_member_id === member.id;

    if (!belongsToMatchup) {
      return res.status(403).json({
        error: "You are not part of this matchup"
      });
    }

    // Cancel any older pending proposal for this matchup
    const { error: cancelError } = await supabase
      .from("scheduling_proposals")
      .update({
        status: "cancelled",
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("matchup_id", matchup_id)
      .eq("status", "pending");

    if (cancelError) {
      console.error("Old proposal cancel failed:", cancelError);
    }

    // Create the new proposal
    const { data: proposal, error: proposalError } = await supabase
      .from("scheduling_proposals")
      .insert({
        matchup_id,
        proposed_by_member_id: member.id,
        proposed_time,
        note: note || null,
        status: "pending"
      })
      .select(
        "id, matchup_id, proposed_by_member_id, proposed_time, note, status, created_at"
      )
      .single();

    if (proposalError || !proposal) {
      console.error("Proposal insert failed:", proposalError);

      return res.status(500).json({
        error: "Could not save proposal"
      });
    }

    // Mark matchup as pending
    const { error: matchupUpdateError } = await supabase
      .from("matchups")
      .update({
        status: "pending",
        updated_at: new Date().toISOString()
      })
      .eq("id", matchup_id);

    if (matchupUpdateError) {
      console.error("Matchup status update failed:", matchupUpdateError);
    }

    return res.status(200).json({
      success: true,
      proposal
    });
  } catch (error) {
    console.error("Proposal API error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
