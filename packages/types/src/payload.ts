import type { Accountability } from './accountability.js';
import type { ActionEventParams, Item, PrimaryKey } from './items.js';
import type { UserIntegrityCheckFlag } from './users.js';

export type PayloadAction = 'create' | 'read' | 'update';

export type PayloadTransformers = {
	[type: string]: (context: {
		action: PayloadAction;
		value: any;
		payload: Partial<Item>;
		accountability: Accountability | null;
		specials: string[];
		// TODO: Implement types for database and schema
		// helpers: Helpers;
	}) => Promise<any>;
};

export type PayloadServiceProcessRelationResult = {
	revisions: PrimaryKey[];
	nestedActionEvents: ActionEventParams[];
	userIntegrityCheckFlags: UserIntegrityCheckFlag;
};
