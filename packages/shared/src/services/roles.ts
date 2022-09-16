import { MutationOptions, PrimaryKey, Query } from '../types';
import { ItemsService } from './items';
export declare interface RolesService extends ItemsService {
	updateOne(key: PrimaryKey, data: Record<string, any>, opts?: MutationOptions): Promise<PrimaryKey>;
	updateBatch(data: Record<string, any>[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	updateMany(keys: PrimaryKey[], data: Record<string, any>, opts?: MutationOptions): Promise<PrimaryKey[]>;
	deleteOne(key: PrimaryKey): Promise<PrimaryKey>;
	deleteMany(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	deleteByQuery(query: Query, opts?: MutationOptions): Promise<PrimaryKey[]>;
}
