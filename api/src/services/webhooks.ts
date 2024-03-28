import { ErrorCode, createError } from '@directus/errors';
import type { Bus } from '@directus/memory';
import { useBus } from '../bus/index.js';
import { useLogger } from '../logger.js';
import type { AbstractServiceOptions, MutationOptions, PrimaryKey, Webhook } from '../types/index.js';
import { ItemsService } from './items.js';

const logger = useLogger();

export class WebhooksService extends ItemsService<Webhook> {
	messenger: Bus;

	constructor(options: AbstractServiceOptions) {
		super('directus_webhooks', options);
		this.messenger = useBus();

		logger.warn(
			'Webhooks are deprecated and the WebhooksService will be removed in an upcoming release. Creating/Updating Webhooks is disabled, use Flows instead',
		);
	}

	override async createOne(): Promise<PrimaryKey> {
		throw new (createError(ErrorCode.MethodNotAllowed, 'Webhooks are deprecated, use Flows instead', 405))();
	}

	override async createMany(): Promise<PrimaryKey[]> {
		throw new (createError(ErrorCode.MethodNotAllowed, 'Webhooks are deprecated, use Flows instead', 405))();
	}

	override updateOne(): Promise<PrimaryKey> {
		throw new (createError(ErrorCode.MethodNotAllowed, 'Webhooks are deprecated, use Flows instead', 405))();
	}

	override async updateMany(): Promise<PrimaryKey[]> {
		throw new (createError(ErrorCode.MethodNotAllowed, 'Webhooks are deprecated, use Flows instead', 405))();
	}

	override async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.deleteMany(keys, opts);
		this.messenger.publish('webhooks', { type: 'reload' });
		return result;
	}
}
