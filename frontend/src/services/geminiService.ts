
export interface Observation {
	startTimestamp: string;
	endTimestamp: string;
	description: string;
}

export interface ActivityCardDistraction {
	startTime: string;
	endTime: string;
	title: string;
	summary: string;
}

export interface ActivityCardAppSites {
	primary?: string;
	secondary?: string;
}

export interface ActivityCard {
	startTime: string;
	endTime: string;
	category: string;
	subcategory?: string;
	title: string;
	summary: string;
	detailedSummary: string;
	distractions?: ActivityCardDistraction[];
	appSites?: ActivityCardAppSites;
}
