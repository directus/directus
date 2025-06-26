import { ErrorCode, createError, type DirectusError } from '@directus/errors';
import type { Bus } from '@directus/memory';
import type { AbstractServiceOptions, MutationOptions, PrimaryKey, Webhook } from '@directus/types';
import { useBus } from '../bus/index.js';
import { useLogger } from '../logger/index.js';
import { ItemsService } from './items.js';

const logger = useLogger();

export class WebhooksService extends ItemsService<Webhook> {
	messenger: Bus;
	errorDeprecation: DirectusError;

	constructor(options: AbstractServiceOptions) {
		super('directus_webhooks', options);
		this.messenger = useBus();

		this.errorDeprecation = new (createError(
			ErrorCode.MethodNotAllowed,
			'Webhooks are deprecated, use Flows instead',
			405,
		))();

		logger.warn(
			'Webhooks are deprecated and the WebhooksService will be removed in an upcoming release. Creating/Updating Webhooks is disabled, use Flows instead',
		);
	}

	override async createOne(): Promise<PrimaryKey> {
		throw this.errorDeprecation;
	}

	override async createMany(): Promise<PrimaryKey[]> {
		throw this.errorDeprecation;
	}

	override async updateBatch(): Promise<PrimaryKey[]> {
		throw this.errorDeprecation;
	}

	override async updateMany(): Promise<PrimaryKey[]> {
		throw this.errorDeprecation;
	}

	override async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.deleteMany(keys, opts);
		this.messenger.publish('webhooks', { type: 'reload' });
		return result;
	}
}
