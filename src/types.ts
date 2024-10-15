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
    region: Regions;
}

export interface SkillsMapping {
    name: string;
    roles: string[] | null;
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
    rewardAmount: number | null;
    rewards: { first: number };
    sponsorId: string;
    pocId: string;
    source: string;
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
    region: Regions;
    pocSocials: any;
    hackathonprize: number;
    applicationType: string;
    timeToComplete: any;
    references: any;
    publishedAt: string;
    isPrivate: boolean;
    compensationType?: 'fixed' | 'range' | 'variable';
    minRewardAsk: number;
    maxRewardAsk: number;
}

export enum Regions {
    GLOBAL = 'GLOBAL',
    INDIA = 'INDIA',
    VIETNAM = 'VIETNAM',
    GERMANY = 'GERMANY',
    TURKEY = 'TURKEY',
    MEXICO = 'MEXICO',
    UK = 'UK',
    UAE = 'UAE',
    NIGERIA = 'NIGERIA',
    ISRAEL = 'ISRAEL',
    BRAZIL = 'BRAZIL',
    MALAYSIA = 'MALAYSIA',
    BALKANS = 'BALKANS',
    PHILIPPINES = 'PHILIPPINES',
    KUMEKA = 'KUMEKA',
    JAPAN = 'JAPAN',
    FRANCE = 'FRANCE',
}

interface Skills {
    skills: string;
    subskills: string[];
}
