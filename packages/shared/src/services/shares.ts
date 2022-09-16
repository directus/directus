import { Item, LoginResult, MutationOptions, PrimaryKey } from '../types';
import { AuthorizationService } from './authorization';
import { ItemsService } from './items';
export declare interface SharesService extends ItemsService {
	authorizationService: AuthorizationService;
	createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
	login(payload: Record<string, any>): Promise<LoginResult>;
	/**
	 * Send a link to the given share ID to the given email(s). Note: you can only send a link to a share
	 * if you have read access to that particular share
	 */
	invite(payload: { emails: string[]; share: PrimaryKey }): Promise<void>;
}
