import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';
import cron from 'node-cron';
import { Bounties, Regions } from './types';
import { logError, logInfo } from './logger';
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

const getRoleFromSkill = (name: string) => {
    const skill = skillsMap.find((x) => x.name === name);
    if (skill) return skill.roles;
};

const formatRewardText = (reward: number, token: string) => {
    return `${token === 'USDC' ? '$' : ''}${reward.toLocaleString()}${token !== 'USDC' ? ` ${token}` : ''}`;
};

const introMessages = [
    "It's Friday, which means new earning opportunities!",
    "Here's a list of new opportunities for all you chads and weekend warriors: ",
    "It’s raining gigs! This week's new drops on Earn: ",
    '💥 Boom! New listings, hot off the press: ',
    'This week, make some bank with Supteream Earn: ',
    'Your weekly (and favourite) alert about new listings is here: ',
    '🚨 New Listing(s) Added on Earn!',
];

const getRandomIntro = () => introMessages[Math.floor(Math.random() * introMessages.length)];

client.once('ready', async () => {
    await logInfo('Discord client ready', { username: client.user?.username });

    const cronTime = '0 12 * * 5';
    const sqlInterval = `INTERVAL 7 DAY`;

    cron.schedule(
        cronTime,
        async () => {
            await logInfo('Running cron');
            const connection = await mysql.createConnection(dbConfig);
            const [rows] = await connection.execute(
                `
                SELECT Bounties.* 
                FROM Bounties 
                JOIN Sponsors ON Bounties.sponsorId = Sponsors.id
                WHERE Bounties.isPublished = 1 
                  AND Bounties.isActive = 1 
                  AND Bounties.isArchived = 0 
                  AND Bounties.isPrivate = 0 
                  AND Bounties.status = 'OPEN' 
                  AND Bounties.isWinnersAnnounced = 0 
                  AND Bounties.publishedAt BETWEEN NOW() - ${sqlInterval} AND NOW() 
                  AND (Bounties.hackathonId IS NULL OR Bounties.hackathonId = '')
                  AND Bounties.usdValue >= 500
                `,
                [sqlInterval],
            );
            const bounties: Bounties[] = rows as Bounties[];
            await logInfo('Bounties fetched', { count: bounties.length });

            if (bounties.length === 0) return;
            const roles: Set<string> = new Set();

            servers.map((server) => {
                let parts = 0;
                const bountyMessages: string[] = [''];

                const categorizedBounties = {
                    Development: [],
                    Design: [],
                    Content: [],
                    Others: [],
                };

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

                    const reward = x.rewardAmount ?? 0;
                    const bountyData = {
                        ...x,
                        reward,
                        link: `https://earn.superteam.fun/listing/${x.slug}/?utm_source=superteam&utm_medium=discord&utm_campaign=bounties`,
                    };

                    if (x.skills.some((sk) => ['Blockchain', 'Frontend', 'Backend', 'Mobile'].includes(sk.skills))) {
                        categorizedBounties.Development.push(bountyData);
                    } else if (x.skills.some((sk) => sk.skills === 'Design')) {
                        categorizedBounties.Design.push(bountyData);
                    } else if (x.skills.some((sk) => ['Content'].includes(sk.skills))) {
                        categorizedBounties.Content.push(bountyData);
                    } else {
                        categorizedBounties.Others.push(bountyData);
                    }
                });

                Object.keys(categorizedBounties).forEach((category) => {
                    categorizedBounties[category].sort((a, b) => b.reward - a.reward);
                });

                const headers = {
                    Development: '💻 Development',
                    Design: '🎨 Design',
                    Content: '✍️ Content',
                    Others: '🛠️ Others',
                };

                if (bounties.length !== 1) bountyMessages[parts] = `${getRandomIntro()}\n\n${bountyMessages[parts]}`;

                Object.keys(categorizedBounties).forEach((category) => {
                    if (categorizedBounties[category].length > 0) {
                        bountyMessages[parts] += `\n${headers[category]}\n\n`;

                        categorizedBounties[category].forEach((x) => {
                            const rewardText = x.compensationType
                                ? x.compensationType === 'fixed'
                                    ? `(${formatRewardText(x.rewardAmount, x.token)})`
                                    : x.compensationType === 'range'
                                      ? `(${formatRewardText(x.minRewardAsk, x.token)} - ${formatRewardText(x.maxRewardAsk, x.token)})`
                                      : x.compensationType === 'variable'
                                        ? '(Variable)'
                                        : ''
                                : '';
                            const message = `${x.title} ${rewardText}\n <${x.link}>\n\n`;
                            if (bountyMessages[parts].length + message.length + 43 + 170 > 2000) {
                                bountyMessages[parts] = `${bountyMessages[parts]}`;
                                parts += 1;
                                bountyMessages.push(message);
                            } else {
                                bountyMessages[parts] += message;
                            }
                        });
                    }
                });

                if (bountyMessages.length === 1 && bountyMessages[0] === '') return;

                const rolesArray = Array.from(roles);
                const guild = client.guilds.cache.get(server.id);
                if (guild) {
                    bountyMessages.forEach((message, index) => {
                        const channel = guild.channels.cache.get(server.earn);
                        if (!channel) {
                            logError(new Error('Channel not found'), {
                                server: server.name,
                                channelId: server.earn,
                            }).catch(() => {});
                            return;
                        }
                        if (!channel.isTextBased()) {
                            logError(new Error('Channel is not text-based'), {
                                server: server.name,
                                channelId: server.earn,
                            }).catch(() => {});
                            return;
                        }
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

                                channel
                                    .send(sendMessage)
                                    .then(() => logInfo('Message sent', { server: server.name }).catch(() => {}))
                                    .catch((err) => logError(err, { server: server.name, stage: 'send' }));
                            } else {
                                channel
                                    .send(sendMessage)
                                    .then(() => logInfo('Message sent', { server: server.name }).catch(() => {}))
                                    .catch((err) => logError(err, { server: server.name, stage: 'send' }));
                            }
                        }
                    });
                } else {
                    logError(new Error('Guild not found'), { serverId: server.id, serverName: server.name }).catch(
                        () => {},
                    );
                }
            });
        },
        {},
    );
});

client.login(process.env.DISCORD_TOKEN).catch((err) => logError(err, { stage: 'login' }));
