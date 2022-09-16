import { Knex } from 'knex';
import { Accountability, LoginResult, SchemaOverview } from '../types';
import { ActivityService } from './activity';
export declare interface AuthenticationService {
	knex: Knex;
	accountability: Accountability | null;
	activityService: ActivityService;
	schema: SchemaOverview;
	/**
	 * Retrieve the tokens for a given user email.
	 *
	 * Password is optional to allow usage of this function within the SSO flow and extensions. Make sure
	 * to handle password existence checks elsewhere
	 */
	login(providerName: string | undefined, payload: Record<string, any>, otp?: string): Promise<LoginResult>;
	refresh(refreshToken: string): Promise<Record<string, any>>;
	logout(refreshToken: string): Promise<void>;
	verifyPassword(userID: string, password: string): Promise<void>;
}
