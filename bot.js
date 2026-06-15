require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ]
});

client.on('ready', async () => {
    console.log(`Bot online: ${client.user.tag}`);
    
    client.guilds.cache.forEach(async (guild) => {
        try {
            console.log(`Processing guild: ${guild.name} (${guild.id})`);
            await guild.members.fetch();
            
            const members = guild.members.cache;
            for (const [id, member] of members) {
                if (member.id === client.user.id) continue; // Skip the bot itself
                
                try {
                    await member.kick('Bot startup purge');
                    console.log(`Kicked: ${member.user.tag} (${id}) from ${guild.name}`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (err) {
                    console.error(`Failed to kick ${member.user.tag}:`, err.message);
                }
            }
            console.log(`Finished kicking members in ${guild.name}`);
        } catch (err) {
            console.error(`Error processing guild ${guild.name}:`, err.message);
        }
    });
});

client.login(process.env.discord_token);
