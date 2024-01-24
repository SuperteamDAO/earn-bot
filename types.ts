export interface CoreRoles {
    name: 'Member' | 'Lurker' | 'Contributor';
    id: string;
}

export interface Roles {
    name: string;
    id: string;
}

export interface Servers {
    name: string;
    id: string;
    earn: string;
    coreRoles: CoreRoles[];
    roles: Roles[];
}

export interface SkillsMapping {
    name: string;
    roles: string[] | null;
    emoji: string;
}

export interface Bounties {
    id: string;
    title: string;
    slug: string;
    description: string;
    deadline: string;
    eligibility: any[];
    status: string;
    token: string;
    rewardAmount: number;
    rewards: { first: number };
    sponsorId: string;
    pocId: string;
    source: string;
    sourceDetails: any;
    isPublished: number;
    isFeatured: number;
    isActive: number;
    isArchived: number;
    createdAt: string;
    updatedAt: string;
    applicationLink: any;
    skills: Skills[];
    type: string;
    requirements: any;
    totalPaymentsMade: number;
    totalWinnersSelected: number;
    isWinnersAnnounced: number;
    templateId: string;
    region: string;
    pocSocials: any;
    hackathonprize: number;
    applicationType: string;
    timeToComplete: any;
    references: any;
    winners: any;
    publishedAt: string;
}

export interface Skills {
    skills: string;
    subskills: string[];
}
