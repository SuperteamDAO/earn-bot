import { Servers, SkillsMapping } from "./types";

export const servers: Servers[] = [
    {
        id: "1194951648787828746",
        name: "Test Server",
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
    },
    {
        id: "857091160295866388",
        name: 'Superteam India',
        earn: "863987156405977129",
        coreRoles: [
            {
                id: "<@&890523787475439646>",
                name: "Member",
            },
            {
                id: "<@&964137634102386738>",
                name: "Contributor",
            },
            {
                id: "<@&892663153211637770>",
                name: "Lurker",
            },
        ],
        roles: [
            {
                id: "<@&903168591208284170>",
                name: "Developer",
            },
            {
                id: "<@&903175566935605258>",
                name: "Marketer",
            },
            {
                id: "<@&903168964459388960>",
                name: "Writer"
            },
            {
                id: "<@&902087934453366794>",
                name: "Designer"
            },
        ]
    },
    {
        id: "1030133683220402348",
        name: 'Superteam Vietnam',
        earn: "1030144854702960753",
        coreRoles: [
            {
                id: "<@&1030140940825919599>",
                name: "Member",
            },
            {
                id: "<@&1030140206944366652>",
                name: "Lurker",
            },
        ],
        roles: []
    },
    {
        id: "1112051655752564766",
        name: "Superteam UK",
        earn: "1183741053883404388",
        coreRoles: [
            {
                id: "<@&1112051655752564775>",
                name: "Lurker",
            },
        ],
        roles: [
            {
                id: "<@&1118296190530891906>",
                name: "Developer"
            },
            {
                id: "<@&1118296252887617627>",
                name: "Designer"
            },
            {
                id: "<@&1118296252887617627>",
                name: "Writer"
            }
        ]
    },
    {
        id: "1132925103798222981",
        earn: "1132925104691626042",
        name: "Superteam Brazil",
        coreRoles: [
            {
                id: "<@&1132925104230240358>",
                name: "Member",
            },
        ],
        roles: [
            {
                id: "<@&1132925103798222987>",
                name: "Designer"
            },
            {
                id: "<@&1132925103798222983>",
                name: "Writer"
            },
            {
                id: "<@&1132925103798222985>",
                name: "Video"
            },
            {
                id: "<@&1132925104230240356>",
                name: "Developer"
            }
        ]
    },
    {
        id: "1034811886996299877",
        name: "Superteam Germany",
        earn: "1035608071768113212",
        coreRoles: [
            {
                id: "<@&1035593636672442379>",
                name: "Member"
            },
            {
                id: "<@&1035139094520541265>",
                name: "Learner"
            }
        ],
        roles: [
            {
                id: "<@&1042477050583339058>",
                name: "Developer"
            },
            {
                id: "<@&1115653334527922176>",
                name: "Designer"
            },
            {
                id: "<@&1115653334527922176>",
                name: "Writer"
            }
        ]
    },
    {
        id: "1138049053595283536",
        name: "Superteam Nigeria",
        earn: "1138049054979403868",
        coreRoles: [
            {
                id: "<@&1138049053595283545>",
                name: "Member"
            },
            {
                id: "<@&1138049053595283544>",
                name: "Lurker"
            }
        ],
        roles: [
            {
                id: "<@&1138049053595283543>",
                name: "Developer"
            },
            {
                id: "<@&1138049053595283542>",
                name: "Designer"
            },
            {
                id: "<@&1138049053595283538>",
                name: "Writer"
            }
        ]
    },
    {
        id: "1127152143720255508",
        name: "Superteam UK",
        earn: "1127152144408137737",
        coreRoles: [
            {
                id: "<@&1127152143720255517>",
                name: "Member"
            },
            {
                id: "<@&1127152143720255516>",
                name: "Lurker"
            },
        ],
        roles: [
            {
                id: "<@&1127152143720255515>",
                name: "Developer"
            },
            {
                id: "<@&1127152143720255514>",
                name: "Designer"
            },
            {
                id: "<@&1127152143720255510>",
                name: "Writer"
            }
        ]
    }
]

export const skillsMap: SkillsMapping[] = [
    {
        name: 'Frontend',
        roles: ["Developer"],
        emoji: "💻"
    },
    {
        name: 'Backend',
        roles: ["Developer"],
        emoji: "💻"
    },
    {
        name: 'Blockchain',
        roles: ["Developer"],
        emoji: "💻"
    },
    {
        name: 'Mobile',
        roles: ["Developer"],
        emoji: "💻"
    },
    {
        name: 'Design',
        roles: ["Designer"],
        emoji: "🎨"
    },
    {
        name: 'Community',
        roles: null,
        emoji: "🫂"
    },
    {
        name: 'Growth',
        roles: null,
        emoji: "📈"
    },
    {
        name: 'Content',
        roles: ["Writer", "Video"],
        emoji: "✍️"
    },
    {
        name: 'Other',
        roles: null,
        emoji: "⭐"
    },
];