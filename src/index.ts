import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';
import cron from 'node-cron';
import { Bounties, Regions, Skills } from './types';
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

const formatRewardText = (reward: number, token: string) => {
    return `${token === 'USDC' ? '$' : ''}${reward.toLocaleString()}${token !== 'USDC' ? ` ${token}` : ''}`
}

client.once('ready', async () => {
    console.log(`⚡ Logged in as ${client.user.username}`);

    const cronTime = '0 12 * * 5';
    const sqlInterval = `INTERVAL 7 DAY`;

    cron.schedule(
        cronTime,
        async () => {
            console.log("🔥 Running cron")
            const connection = await mysql.createConnection(dbConfig);
            const [rows] = await connection.execute(
                `SELECT * FROM Bounties WHERE isPublished=1 AND isActive=1 AND isArchived=0 AND isPrivate=0 AND status='OPEN' AND isWinnersAnnounced=0 AND publishedAt BETWEEN NOW() - ${sqlInterval} AND NOW() AND (hackathonId IS NULL OR hackathonId = '')`,
            );
            const bounties: Bounties[] = rows as Bounties[];
            console.log(`🚨 Bounties found ${bounties.length}`)

            if (bounties.length === 0) return;
            const roles: Set<string> = new Set();

            servers.map((server) => {
                let parts = 0;
                const bountyMessages: string[] = [''];

                bounties.forEach((x) => {
                    if (x.region !== Regions.GLOBAL && x.region !== server.region) return;
                    x.skills.forEach((sk) => {
                        const skillRoles = getRoleFromSkill(sk.skills);
                        if (skillRoles !== null) {
                            skillRoles.forEach((role) => {
                                roles.add(role);
                            });
                        }
                    });
                    const emoji = getEmoji(x.skills[0]);

                    const link = `https://earn.superteam.fun/listings/${x.type}/${x.slug}/?utm_source=superteam&utm_medium=discord&utm_campaign=bounties`;
                    const modifiedLink = bounties.length === 1 ? link : `<${link}>`;

                    const rewardText = x.compensationType ?
                        x.compensationType === 'fixed' ?
                            `(${formatRewardText(x.rewardAmount, x.token)})` :
                            x.compensationType === 'range' ?
                                `(${formatRewardText(x.minRewardAsk, x.token)} - ${formatRewardText(x.maxRewardAsk, x.token)})` :
                                x.compensationType === 'variable' ?
                                    "Variable" :
                                    "" : "";
                    const message = `${emoji} ${x.title} ${rewardText}\n🔗 ${modifiedLink}\n\n`;
                    // breakdown: current message length + new message length + 43 (for the intro) + 170 (for the roles) and 2000 the max length of a discord message
                    if (bountyMessages[parts].length + message.length + 43 + 170 > 2000) {
                        bountyMessages[parts] =
                            `🚨 New Listing(s) Added on Earn! (Part ${parts + 1})\n\n${bountyMessages[parts]}`;
                        parts += 1;
                        bountyMessages.push(message);
                    } else {
                        bountyMessages[parts] += message;
                    }
                });

                if (bountyMessages.length === 1 && bountyMessages[0] === '') return;
                if (bounties.length !== 1)
                    bountyMessages[parts] =
                        `🚨 New Listing(s) Added on Earn!${parts === 0 ? '' : ` (Part ${parts + 1})`}\n\n${bountyMessages[parts]}`;

                const rolesArray = Array.from(roles);
                const guild = client.guilds.cache.get(server.id);
                if (guild) {
                    bountyMessages.forEach((message, index) => {
                        const channel = guild.channels.cache.get(server.earn);
                        if (channel && channel.isTextBased()) {
                            let sendMessage = message;
                            if (bountyMessages.length === 1 || bountyMessages.length - 1 === index) {
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

                                channel.send(sendMessage);
                            } else {
                                channel.send(sendMessage);
                            }
                            console.log(`📤 Message sent to ${server.name}`)
                        }
                    });
                }
            });
        },
        {},
    );
});

client.login(process.env.DISCORD_TOKEN);
