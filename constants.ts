import { Servers, SkillsMapping } from "./types";

export const servers: Servers[] = [
    {
        id: "1194951648787828746",
        name: "Server 1",
        earn: "1195326162126254171",
        coreRoles: [
            {
                id: "<@&1195713590443913287>",
                name: "Member"
            },
            {
                id: "<@&1195713668336341052>",
                name: "Contributor"
            },
            {
                id: "<@&1195713634626699385>",
                name: "Lurker"
            }
        ],
        roles: [
            {
                name: "Developer",
                id: "<@&1195694023013302363>"
            },
            {
                name: "Designer",
                id: "<@&1195694257953054720>"
            },
            {
                name: "Writer",
                id: "<@&1195706896276013056>"
            }
        ]
    }
]

export const skillsMap: SkillsMapping[] = [
    {
        name: 'Frontend',
        role: "Developer",
        emoji: "💻"
    },
    {
        name: 'Backend',
        role: "Developer",
        emoji: "💻"
    },
    {
        name: 'Blockchain',
        role: "Developer",
        emoji: "💻"
    },
    {
        name: 'Mobile',
        role: "Developer",
        emoji: "💻"
    },
    {
        name: 'Design',
        role: "Designer",
        emoji: "🎨"
    },
    {
        name: 'Community',
        role: "",
        emoji: ""
    },
    {
        name: 'Growth',
        role: "",
        emoji: ""
    },
    {
        name: 'Content',
        role: "Writer",
        emoji: "✍️"
    },
    {
        name: 'Other',
        role: "",
        emoji: ""
    },
];