import { PrimaryKey } from '../types';
import { ItemsService } from './index';
export declare interface RevisionsService extends ItemsService {
	revert(pk: PrimaryKey): Promise<void>;
}
