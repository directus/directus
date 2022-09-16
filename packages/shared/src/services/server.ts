import { Knex } from 'knex';
import { Accountability, SchemaOverview } from '../types';
import { SettingsService } from './settings';
export declare interface ServerService {
	knex: Knex;
	accountability: Accountability | null;
	settingsService: SettingsService;
	schema: SchemaOverview;
	serverInfo(): Promise<Record<string, any>>;
	health(): Promise<Record<string, any>>;
}
