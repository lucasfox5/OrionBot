const express = require("express");
const axios = require("axios");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// -------------------------------
// STATUS ENDPOINT (Roblox checks this)
// -------------------------------
app.get("/status", (req, res) => {
  res.json({ online: true });
});

// -------------------------------
// ROBLOX SENDS CODE HERE
// -------------------------------
let pendingCodes = []; 
// Format: [{ userId: 12345, code: "123456" }]

app.post("/createCode", (req, res) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.json({ success: false, message: "Missing userId or code" });
  }

  pendingCodes.push({ userId, code });
  console.log("Saved code:", userId, code);

  return res.json({ success: true });
});

// -------------------------------
// RESET VERIFY ENDPOINT (Bot calls this)
// -------------------------------
app.post("/resetverify", (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.json({ success: false, message: "Missing userId" });
  }

  pendingCodes = pendingCodes.filter(entry => entry.userId != userId);
  console.log("RESET DONE FOR:", userId);

  return res.json({ success: true });
});

// -------------------------------
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// -------------------------------
// DISCORD BOT
// -------------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("ready", () => {
  console.log(`🤖 Bot online as ${client.user.tag}`);
  console.log("Restarted at:", new Date().toLocaleString());
  client.user.setActivity("Looking Over Orion", { type: "WATCHING" });
});

// -------------------------------
// !pverify <code>
// -------------------------------
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");

  if (args[0].toLowerCase() === "!pverify") {
    const code = args[1];

    if (!code) {
      const embed = new EmbedBuilder()
        .setTitle("❌ Missing Code")
        .setDescription("Please provide your verification code.")
        .setColor(0xff0000);
      return message.reply({ embeds: [embed] });
    }

    const entry = pendingCodes.find(e => e.code == code);

    if (!entry) {
      const embed = new EmbedBuilder()
        .setTitle("❌ Invalid Code")
        .setDescription("That code is invalid or expired.")
        .setColor(0xff0000);
      return message.reply({ embeds: [embed] });
    }

    const userId = entry.userId;

    try {
      await axios.post(process.env.ROBLOX_VERIFY_API, { userId });

      pendingCodes = pendingCodes.filter(e => e.code != code);

      const embed = new EmbedBuilder()
        .setTitle("✅ Verified")
        .setDescription(`Roblox user **${userId}** has been verified.`)
        .setColor(0x00ff00);
      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      const embed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("Error contacting Roblox verification server.")
        .setColor(0xff0000);
      return message.reply({ embeds: [embed] });
    }
  }

  // -------------------------------
  // !resetverify <userId>
  // -------------------------------
  if (args[0].toLowerCase() === "!resetverify") {
    const userId = args[1];

    if (!userId || isNaN(userId)) {
      const embed = new EmbedBuilder()
        .setTitle("❌ Invalid User ID")
        .setDescription("Please provide a valid Roblox UserId.")
        .setColor(0xff0000);
      return message.reply({ embeds: [embed] });
    }

    try {
      const response = await axios.post(process.env.ROBLOX_RESET_API, {
        userId: userId
      });

      const embed = new EmbedBuilder()
        .setTitle(response.data.success ? "✅ Successfully Reset" : "❌ Couldn't Reset")
        .setDescription(
          response.data.success
            ? `Verification reset for Roblox user **${userId}**.`
            : "Reset failed. Please check the user ID or try again later."
        )
        .setColor(response.data.success ? 0x00ff00 : 0xff0000);

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      const embed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("Error contacting Roblox reset server.")
        .setColor(0xff0000);
      return message.reply({ embeds: [embed] });
    }
  }
});

// -------------------------------
client.login(process.env.TOKEN);
