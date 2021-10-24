import { IStorage } from './storage';
import { ITransport } from './transport';
import { PasswordsHandler } from './handlers/passwords';

export type AuthCredentials = {
	email: string;
	password: string;
	otp?: string;
};

export type AuthToken = string;

export type AuthResultType = 'DynamicToken' | 'StaticToken' | null;

export type AuthResult<T extends AuthResultType = 'DynamicToken'> = {
	access_token: T extends 'DynamicToken' | 'StaticToken' ? string : null;
	expires: T extends 'DynamicToken' ? number : null;
	refresh_token?: T extends 'DynamicToken' ? string : null;
};

export type AuthMode = 'json' | 'cookie';

export type AuthOptions = {
	mode?: AuthMode;
	autoRefresh?: boolean;
	msRefreshBeforeExpires?: number;
	transport: ITransport;
	storage: IStorage;
};

export abstract class IAuth {
	mode = (typeof window === 'undefined' ? 'json' : 'cookie') as AuthMode;
	autoRefresh = true;
	msRefreshBeforeExpires = 30000;

	abstract readonly token: string | null;
	abstract readonly password: PasswordsHandler;
	abstract readonly transport: ITransport;
	abstract readonly storage: IStorage;

	abstract login(credentials: AuthCredentials): Promise<AuthResult>;
	abstract refresh(force?: boolean): Promise<AuthResult | false>;
	abstract static(token: AuthToken): Promise<boolean>;
	abstract logout(): Promise<void>;
}
