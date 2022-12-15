import { SchemaHelper } from '../types';

export class SchemaHelperMSSQL extends SchemaHelper {
	formatUUID(uuid: string): string {
		return uuid.toUpperCase();
	}
}
