import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { discord_user_id } = req.query;

    if (!discord_user_id) {
      return res.status(400).json({
        error: "Missing Discord user ID"
      });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    const { data, error } = await supabase
      .from("league_members")
      .select(
        "discord_user_id, discord_username, team_name, team_abbr, is_commissioner, is_active"
      )
      .eq("discord_user_id", discord_user_id)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: "League member not found"
      });
    }

    return res.status(200).json({
      member: data
    });
  } catch (error) {
    console.error("Member lookup error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
