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
};

const getEmoji = (skill: Skills) => {
    const getSkill = skillsMap.find((x) => x.name === skill.skills);
    if (getSkill) {
        if (getSkill.name === 'Content') {
            if (skill.subskills.includes('Video')) {
                return '🎥';
            }
            return '✍️';
        }
        return getSkill.emoji;
    }
    return '🤖';
};

const getRoleFromSkill = (name: string) => {
    const skill = skillsMap.find((x) => x.name === name);
    if (skill) return skill.roles;
};

client.once('ready', async () => {
    console.log(`⚡ Logged in as ${client.user.username}`);

    // time should be in the format "Xs" | "XM" | "XH" | "Xd
    const time = '12H';
    let cronTime: string;
    let sqlInterval: string;

    if (time.endsWith('s')) {
        const seconds = parseInt(time);
        cronTime = `*/${seconds} * * * *`;
        sqlInterval = `INTERVAL ${seconds} SECOND`;
    } else if (time.endsWith('M')) {
        const minutes = parseInt(time);
        cronTime = `*/${minutes} * * * *`;
        sqlInterval = `INTERVAL ${minutes} MINUTE`;
    } else if (time.endsWith('H')) {
        const hours = parseInt(time);
        cronTime = `0 */${hours} * * *`;
        sqlInterval = `INTERVAL ${hours} HOUR`;
    } else if (time.endsWith('d')) {
        const days = parseInt(time);
        cronTime = `0 0 */${days} * *`;
        sqlInterval = `INTERVAL ${days} DAY`;
    } else {
        throw new Error('Invalid time format');
    }

    cron.schedule(cronTime, async () => {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT * FROM Bounties WHERE isPublished=1 AND isActive=1 AND isArchived=0 AND isPrivate=0 AND status='OPEN' AND publishedAt BETWEEN NOW() - ${sqlInterval} AND NOW()`,
        );
        const bounties: Bounties[] = rows as Bounties[];

        if (bounties.length === 0) return;
        const roles: Set<string> = new Set();
        let bountyMessage = bounties.length === 1 ? '' : `🚨 New Listing(s) Added on Earn!\n\n`;

        bounties.forEach((x) => {
            x.skills.forEach((sk) => {
                const skillRoles = getRoleFromSkill(sk.skills);
                if (skillRoles !== null) {
                    skillRoles.forEach((role) => {
                        roles.add(role);
                    });
                }
            });
            const emoji = getEmoji(x.skills[0]);

            const link = `https://earn.superteam.fun/listings/bounties/${x.slug}/?utm_source=superteam&utm_medium=discord&utm_campaign=bounties`;
            const modifiedLink = bounties.length === 1 ? link : `<${link}>`;

            bountyMessage += `${emoji} ${x.title} (${x.token === 'USDC' ? '$' : ''}${x.rewardAmount.toLocaleString()}${x.token !== 'USDC' ? ` ${x.token}` : ''})\n🔗 ${modifiedLink}\n\n`;
        });

        const rolesArray = Array.from(roles);

        servers.map((server) => {
            let sendMessage = bountyMessage;
            const guild = client.guilds.cache.get(server.id);
            if (guild) {
                server.coreRoles.forEach((role) => {
                    if (rolesArray.length !== 0 && role.name === 'Member') return;
                    sendMessage += `${role.id} `;
                });

                const rolesAdded = new Set();
                rolesArray.forEach((role) => {
                    const guildRole = server.roles.find((x) => x.name === role);
                    // Added check to prevent duplicate roles tag
                    if (guildRole && !rolesAdded.has(guildRole.id)) {
                        rolesAdded.add(guildRole.id);
                        sendMessage += `${guildRole.id} `;
                    }
                });
                const channel = guild.channels.cache.get(server.earn);
                if (channel && channel.isTextBased()) {
                    channel.send(sendMessage);
                }
            }
        });
    }, { timezone: "Asia/Kolkata" });
});

client.login(process.env.DISCORD_TOKEN);
