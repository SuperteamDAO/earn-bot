import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';

dotenv.config();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: true,
    },
}

const servers = [
    {
        id: 1194951648787828746,
        name: "Server 1",
        earn: 1195326162126254171
    }
]
client.once('ready', async () => {

    console.log(`Logged in as ${client.user?.tag}`);
    console.log(client.guilds.cache.map((guild) => guild.id).join(', '))
    console.log(client.channels.cache.map((channel) => channel.id).join(', '))
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`SELECT * FROM Bounties;`);
    console.log(rows);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    message.reply("Hello brother")
});

client.login(process.env.DISCORD_TOKEN);
