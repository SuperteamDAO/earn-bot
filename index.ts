import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';
import cron from 'node-cron';
import { Bounties, Skills } from './types';
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

const getEmoji = (skill: Skills) => {
    const getSkill = skillsMap.find(x => x.name === skill.skills)
    if(getSkill){
        if(getSkill.name === "Content"){
            if(skill.subskills.includes("Video")){
                return '🎥'
            }
            return '✍️'
        }
        return getSkill.emoji
    }
    return '🤖'
}

const getRoleFromSkill = (name: string) => {
    const skill = skillsMap.find(x => x.name === name)
    if (skill) return skill.roles
}

client.once('ready', async () => {
    console.log(`⚡Logged in as ${client.user.username}`);

    const cronTime = '*/5 * * * * *'
    // const cronTime = '0 */12 * * *'
    cron.schedule(cronTime, async () => {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`SELECT * FROM Bounties WHERE isPublished=1 AND isActive=1 AND hackathonprize=0 AND isArchived=0 AND status='OPEN' AND createdAt BETWEEN NOW() - INTERVAL 12 HOUR AND NOW()`);
        const bounties: Bounties[] = rows as Bounties[];

        let roles: Set<string> = new Set();
        let bountyMessage = bounties.length === 1 ? '' : `🚨 New Bounties Listing!\n\n`;

        bounties.forEach(x => {
            x.skills.forEach(sk => {
                const skillRoles = getRoleFromSkill(sk.skills)
                if (skillRoles !== null) {
                    skillRoles.forEach(role => {
                        roles.add(role)
                    })
                }
            })
            const emoji = getEmoji(x.skills[0])

            const link = `https://earn.superteam.fun/listings/bounties/${x.slug}/?utm_source=superteam&utm_medium=discord&utm_campaign=bounties`
            const modifiedLink = bounties.length === 1 ? link : `<${link}>`

            bountyMessage += `${emoji} ${x.title} (\$${x.rewardAmount})\n\n🔗 ${modifiedLink}\n\n`
        })

        const rolesArray = Array.from(roles)

        servers.map((server) => {
            const guild = client.guilds.cache.get(server.id)
            if (guild) {
                server.coreRoles.forEach((role) => {
                    bountyMessage += `${role.id} `
                })
                // Make set and dont tag if already in set
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
    })
});

client.login(process.env.DISCORD_TOKEN);
