import { ItemsService } from './items';
import { AbstractServiceOptions, PrimaryKey, Revision } from '../types';
import { InvalidPayloadException, ForbiddenException } from '../exceptions';

/**
 * @TODO only return data / delta based on permissions you have for the requested collection
 */

export class RevisionsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_revisions', options);
	}

	async revert(pk: PrimaryKey) {
		const revision = (await super.readByKey(pk)) as Revision | null;
		if (!revision) throw new ForbiddenException();

		if (!revision.data) throw new InvalidPayloadException(`Revision doesn't contain data to revert to`);

		const service = new ItemsService(revision.collection, {
			accountability: this.accountability,
			knex: this.knex,
			schema: this.schema,
		});

		await service.update(revision.data, revision.item);
	}
}
