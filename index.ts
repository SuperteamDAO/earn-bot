import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';
import cron from 'node-cron';
import { Bounties } from './types';
import { servers, skillsMap } from './constants';

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

const getEmoji = (name: string) => {
    const skill = skillsMap.find(x => x.name === name)
    if(skill) return skill.emoji
    return '🤖'
}

const getRoleFromSkill = (name: string) => {
    const skill = skillsMap.find(x => x.name === name)
    if(skill) return skill.role
}

client.once('ready', async () => {

    console.log(`Logged in as ${client.user?.tag}`);

    // const cronTime = '*/5 * * * * *'
    // const cronTime = '0 */12 * * *'
    // cron.schedule(cronTime, async () => {
    //     console.log('Running cron job...');
    // })

    const connection = await mysql.createConnection(dbConfig);
    // TODO: createdAt BETWEEN NOW() - INTERVAL 12 HOUR AND NOW()
    const [rows] = await connection.execute(`SELECT * FROM Bounties WHERE isPublished=1 AND isActive=1 AND hackathonprize=0 AND isArchived=0 AND status='OPEN'`);
    const bounties: Bounties[] = rows as Bounties[];

    let roles: Set<string> = new Set();
    let bountyMessage = ''
    
    if (bounties.length === 1) {
        const emoji = getEmoji(bounties[0].skills[0].skills)
        bounties[0].skills.forEach(sk => roles.add(getRoleFromSkill(sk.skills)))

        bountyMessage += `${emoji} ${bounties[0].title} (\$${bounties[0].rewardAmount})\n\n🔗 https://earn.superteam.fun/listings/bounties/${bounties[0].slug}/?utm_source=superteam&utm_medium=discord&utm_campaign=bounties\n\n`
    }
    else {
        bountyMessage += `🚨 New Bounties Listing!\n\n`
        bounties.slice(1, 3).forEach(x => {
            const emoji = getEmoji(x.skills[0].skills)
            x.skills.forEach(sk => roles.add(getRoleFromSkill(sk.skills)))
            bountyMessage += `${emoji} ${x.title} (\$${x.rewardAmount})\n\n🔗 <https://earn.superteam.fun/listings/bounties/${x.slug}/?utm_source=superteam&utm_medium=discord&utm_campaign=bounties>\n\n`
        })
    }

    const rolesArray = Array.from(roles)

    servers.map((server) => {
        const guild = client.guilds.cache.get(server.id)
        if (guild) {
            server.coreRoles.forEach((role) => {
                bountyMessage += `${role.id} `
            })
            rolesArray.forEach((role) => {
                const guildRole = server.roles.find(x => x.name === role)
                if (guildRole) {
                    bountyMessage += `${guildRole.id} `
                }
            })
            const channel = guild.channels.cache.get(server.earn)
            if (channel && channel.isTextBased()) {
                channel.send(bountyMessage)
            }
        }
    })
});

client.login(process.env.DISCORD_TOKEN);
