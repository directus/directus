import { Knex } from 'knex';
import Auth, { AuthConstructor } from './auth';
import BasicAuth from './basic-auth';
import { InvalidConfigException, DriverNotSupportedException } from './exceptions';
import { AuthManagerConfig, AuthManagerProviderConfig, AuthProviderConfig } from './types';

export default class AuthManager {
	private knex: Knex;
	private defaultProvider?: string;
	private providerConfigs: AuthManagerProviderConfig;
	private _providers: Map<string, Auth> = new Map();
	private _drivers: Map<string, AuthConstructor> = new Map();

	constructor(knex: Knex, config: AuthManagerConfig) {
		this.knex = knex;
		this.defaultProvider = config.default;
		this.providerConfigs = config.providers || {};
		this.registerDriver('basic', BasicAuth);
	}

	/**
	 * Get the instantiated providers
	 */
	getProviders(): Map<string, Auth> {
		return this._providers;
	}

	/**
	 * Get the registered drivers
	 */
	getDrivers(): Map<string, AuthConstructor> {
		return this._drivers;
	}

	/**
	 * Get an auth provider
	 */
	getProvider(name?: string): Auth {
		name = name ?? this.defaultProvider;

		if (!name) {
			throw new InvalidConfigException('Missing auth provider name');
		}

		/**
		 * Return cached provider
		 */
		if (this._providers.has(name)) {
			return this._providers.get(name) as Auth;
		}

		const providerConfig = this.providerConfigs[name];

		if (!providerConfig) {
			throw new InvalidConfigException('Missing auth provider config', name);
		}

		const Driver = this._drivers.get(providerConfig.driver);

		if (!Driver) {
			throw new DriverNotSupportedException('Driver not supported', providerConfig.driver);
		}

		const provider = new Driver(this.knex, name, providerConfig.config);
		this._providers.set(name, provider);
		return provider;
	}

	/**
	 * Add an auth provider
	 */
	addProvider(name: string, config: AuthProviderConfig): void {
		if (this.providerConfigs[name]) {
			throw new InvalidConfigException('Provider already registered', name);
		}
		this.providerConfigs[name] = config;
	}

	/**
	 * Register an auth driver
	 */
	registerDriver(name: string, driver: AuthConstructor): void {
		this._drivers.set(name, driver);
	}
}
