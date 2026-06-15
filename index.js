require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ]
});

client.on('clientReady', async () => {
    console.log(`✅ Bot online: ${client.user.tag}`);
    console.log(`📊 In ${client.guilds.cache.size} server(s)`);

    for (const guild of client.guilds.cache.values()) {
        try {
            console.log(`🔄 Processing guild: ${guild.name} (${guild.id}) | Members: ${guild.memberCount}`);
            
            await guild.members.fetch({ force: true });
            console.log(`✅ Fetched all members`);

            let kickedCount = 0;
            for (const [id, member] of guild.members.cache) {
                if (member.id === client.user.id) {
                    console.log(`⏭️  Skipped bot itself`);
                    continue;
                }

                try {
                    await member.kick('Bot startup purge - all members kicked');
                    kickedCount++;
                    console.log(`✅ Kicked: ${member.user.tag} (${id})`);
                    await new Promise(r => setTimeout(r, 800)); // safer delay
                } catch (err) {
                    console.error(`❌ Failed to kick ${member.user.tag}: ${err.message}`);
                }
            }
            
            console.log(`🏁 Finished ${guild.name} | Kicked: ${kickedCount} members`);
        } catch (err) {
            console.error(`💥 Error in guild ${guild.name}:`, err.message);
        }
    }

    console.log(`🎉 All guilds processed. Bot will stay online.`);
});

client.login(process.env.discord_token);
