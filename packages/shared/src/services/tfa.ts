import { Knex } from 'knex';
import { PrimaryKey } from '../types';
import { ItemsService } from './items';
export declare interface TFAService {
	knex: Knex;
	itemsService: ItemsService;
	verifyOTP(key: PrimaryKey, otp: string, secret?: string): Promise<boolean>;
	generateTFA(key: PrimaryKey): Promise<Record<string, string>>;
	enableTFA(key: PrimaryKey, otp: string, secret: string): Promise<void>;
	disableTFA(key: PrimaryKey): Promise<void>;
}
