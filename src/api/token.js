export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code } = req.body || {};

    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    const tokenResponse = await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.VITE_DISCORD_CLIENT_ID,
          client_secret: process.env.DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Discord token exchange failed:", tokenData);
      return res.status(tokenResponse.status).json({
        error: "Discord token exchange failed",
      });
    }

    return res.status(200).json({
      access_token: tokenData.access_token,
    });
  } catch (error) {
    console.error("Token endpoint error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
