import type { AllCollections, MergeCoreCollection, SingletonCollections } from '../index.js';
import type { DirectusActivity } from './activity.js';
import type { DirectusVersion } from './version.js';

export type DirectusRevision<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_revisions',
	{
		id: number;
		activity: DirectusActivity<Schema> | number;
		collection: AllCollections<Schema> | SingletonCollections<Schema>;
		item: string;
		data: Record<string, any> | null;
		delta: Record<string, any> | null;
		parent: DirectusRevision<Schema> | number | null;
		version: DirectusVersion<Schema> | string | null;
	}
>;
