import { Knex } from 'knex';
import { Accountability, AST, Item, PermissionsAction, PrimaryKey, SchemaOverview } from '../types';
import { PayloadService } from './payload';
export declare interface AuthorizationService {
	knex: Knex;
	accountability: Accountability | null;
	payloadService: PayloadService;
	schema: SchemaOverview;
	processAST(ast: AST, action?: PermissionsAction): Promise<AST>;
	/**
	 * Checks if the provided payload matches the configured permissions, and adds the presets to the payload.
	 */
	validatePayload(action: PermissionsAction, collection: string, data: Partial<Item>): Partial<Item>;
	checkAccess(action: PermissionsAction, collection: string, pk: PrimaryKey | PrimaryKey[]): Promise<void>;
}
