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
    return `${token === 'USDC' ? '$' : ''}${reward.toLocaleString()}${token !== 'USDC' ? ` ${token}` : ''}`;
};

const introMessages = [
    "It's Friday, which means new earnings opportunities!",
    "Here's a list of new opportunities for all you chads and weekend warriors:",
    "It’s raining gigs! This week's new drops on Earn",
    '💥Boom! New listings, hot off the press',
    'This week, make some bank with Earn',
    'Your weekly (and favourite) alert with new listings is here:',
];

const getRandomIntro = () => introMessages[Math.floor(Math.random() * introMessages.length)];

client.once('ready', async () => {
    console.log(`⚡ Logged in as ${client.user.username}`);

    const cronTime = '0 12 * * 5';
    const sqlInterval = `INTERVAL 7 DAY`;

    cron.schedule(
        cronTime,
        async () => {
            console.log('🔥 Running cron');
            const connection = await mysql.createConnection(dbConfig);
            const [rows] = await connection.execute(
                `SELECT * FROM Bounties WHERE isPublished=1 AND isActive=1 AND isArchived=0 AND isPrivate=0 AND status='OPEN' AND isWinnersAnnounced=0 AND publishedAt BETWEEN NOW() - ${sqlInterval} AND NOW() AND (hackathonId IS NULL OR hackathonId = '')`,
            );
            const bounties: Bounties[] = rows as Bounties[];
            console.log(`🚨 Bounties found ${bounties.length}`);

            if (bounties.length === 0) return;
            const roles: Set<string> = new Set();

            const categorizedBounties = {
                Development: [],
                Design: [],
                Content: [],
                Others: [],
            };

            servers.forEach((server) => {
                bounties.forEach((bounty: Bounties) => {
                    if (bounty.region !== Regions.GLOBAL && bounty.region !== server.region) return;

                    bounty.skills.forEach((skill) => {
                        const skillRoles = getRoleFromSkill(skill.skills);
                        if (skillRoles !== null) {
                            skillRoles.forEach((role) => {
                                roles.add(role);
                            });
                        }
                    });

                    const reward = bounty.rewardAmount ?? 0;
                    const bountyData = {
                        ...bounty,
                        reward,
                        link: `https://earn.superteam.fun/listings/${bounty.type}/${bounty.slug}/?utm_source=superteam&utm_medium=discord&utm_campaign=bounties`,
                    };

                    if (bounty.skills.some((skill) => ['Developer', 'Blockchain', 'Frontend', 'Backend', 'Mobile'].includes(skill.skills))) {
                        categorizedBounties.Development.push(bountyData);
                    } else if (bounty.skills.some((skill) => skill.skills === 'Designer')) {
                        categorizedBounties.Design.push(bountyData);
                    } else if (bounty.skills.some((skill) => ['Writer', 'Video'].includes(skill.skills))) {
                        categorizedBounties.Content.push(bountyData);
                    } else {
                        categorizedBounties.Others.push(bountyData);
                    }
                });

                Object.keys(categorizedBounties).forEach((category) => {
                    categorizedBounties[category].sort((a, b) => b.reward - a.reward);
                });

                const bountyMessages: string[] = [getRandomIntro()];

                ['Development', 'Design', 'Content', 'Others'].forEach((category) => {
                    const categoryHeader = `\n${category === 'Development' ? '💻' : category === 'Design' ? '🎨' : category === 'Content' ? '✍️' : '🛠️'} ${category}\n\n`;
                    bountyMessages.push(categoryHeader);

                    categorizedBounties[category].forEach((bounty) => {
                        const rewardText = bounty.compensationType
                            ? bounty.compensationType === 'fixed'
                                ? `(${formatRewardText(bounty.rewardAmount, bounty.token)})`
                                : bounty.compensationType === 'range'
                                  ? `(${formatRewardText(bounty.minRewardAsk, bounty.token)} - ${formatRewardText(bounty.maxRewardAsk, bounty.token)})`
                                  : bounty.compensationType === 'variable'
                                    ? '(Variable)'
                                    : ''
                            : '';
                        const message = `${bounty.title} ${rewardText}\n🔗 <${bounty.link}>\n\n`;
                        if (bountyMessages[bountyMessages.length - 1].length + message.length + 170 > 2000) {
                            bountyMessages.push(message);
                        } else {
                            bountyMessages[bountyMessages.length - 1] += message;
                        }
                    });
                });

                const rolesArray = Array.from(roles);
                const guild = client.guilds.cache.get(server.id);
                if (guild) {
                    bountyMessages.forEach((message) => {
                        const channel = guild.channels.cache.get(server.earn);
                        if (channel && channel.isTextBased()) {
                            let sendMessage = message;
                            if (bountyMessages[bountyMessages.length - 1] === message) {
                                server.coreRoles.forEach((role) => {
                                    if (rolesArray.length !== 0 && role.name === 'Member') return;
                                    sendMessage += `${role.id} `;
                                });

                                const rolesAdded = new Set();
                                rolesArray.forEach((role) => {
                                    const guildRole = server.roles.find((x) => x.name === role);
                                    if (guildRole && !rolesAdded.has(guildRole.id)) {
                                        rolesAdded.add(guildRole.id);
                                        sendMessage += `${guildRole.id} `;
                                    }
                                });
                            }
                            channel.send(sendMessage);
                            console.log(`📤 Message sent to ${server.name}`);
                        }
                    });
                }
            });
        },
        {},
    );
});

client.login(process.env.DISCORD_TOKEN);
