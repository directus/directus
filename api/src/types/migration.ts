export type Migration = {
	version: string;
	name: string;
	timestamp: Date;
};

export type MigrationOptions = {
	constraint?: 'always' | 'saas';
};
