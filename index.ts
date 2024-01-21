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

const TIME_UNITS = {
    's': 'SECOND',
    'M': 'MINUTE',
    'H': 'HOUR',
    'd': 'DAY',
};

const getCronAndSqlInterval = (time: string): [string, string] => {
    const unit = time.slice(-1);
    const value = parseInt(time);
    const cronUnit = TIME_UNITS[unit];
    
    if (!cronUnit) {
        throw new Error('Invalid time format');
    }

    const cronTime = unit === 's' ? `*/${value} * * * *` : unit === 'd' ? `0 0 */${value} * *` : `0 */${value} * * *`;
    const sqlInterval = `INTERVAL ${value} ${cronUnit}`;
    
    return [cronTime, sqlInterval];
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

const getBountiesFromDatabase = async (): Promise<Bounties[]> => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute(`
            SELECT * FROM Bounties 
            WHERE isPublished=1 AND isActive=1 AND isArchived=0 AND status='OPEN' 
            AND createdAt BETWEEN NOW() - ${sqlInterval} AND NOW()
        `);
        return rows as Bounties[];
    } finally {
        await connection.end();
    }
};

const sendBountyMessages = (bounties: Bounties[], rolesArray: string[]) => {
    const roles = new Set<string>(rolesArray);
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

        bountyMessage += `${emoji} ${x.title} (${x.token === 'USDC' ? '$' : ''}${x.rewardAmount.toLocaleString()}${x.token !== 'USDC' ? ` ${x.token}` : ''})\n\n🔗 ${modifiedLink}\n\n`;
    });

    const rolesArray = Array.from(roles);

    servers.forEach((server) => {
        const guild = client.guilds.cache.get(server.id);
        if (guild) {
            server.coreRoles.forEach((role) => {
                if (rolesArray.length !== 0 && role.name === 'Member') return;
                bountyMessage += `${role.id} `;
            });

            const rolesAdded = new Set();
            rolesArray.forEach((role) => {
                const guildRole = server.roles.find((x) => x.name === role);
                // Added check to prevent duplicate roles tag
                if (guildRole && !rolesAdded.has(guildRole.id)) {
                    rolesAdded.add(guildRole.id);
                    bountyMessage += `${guildRole.id} `;
                }
            });
            const channel = guild.channels.cache.get(server.earn);
            if (channel && channel.isTextBased()) {
                channel.send(bountyMessage);
            }
        }
    });
};

client.once('ready', async () => {
    console.log(`⚡ Logged in as ${client.user.username}`);

    const [cronTime, sqlInterval] = getCronAndSqlInterval('12H');

    cron.schedule(cronTime, async () => {
        try {
            const bounties = await getBountiesFromDatabase();
            if (bounties.length === 0) return;

            const rolesArray = Array.from(roles);

            sendBountyMessages(bounties, rolesArray);
        } catch (error) {
            console.error('Error during cron job:', error);
        }
    });
});

client.login(process.env.DISCORD_TOKEN);
