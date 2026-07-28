import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import getDatabase from '../../../database/index.js';
import { FlowsService } from '../../../services/flows.js';
import { getSchema } from '../../../utils/get-schema.js';

export async function getActiveFlows(opts?: { knex?: Knex | undefined }) {
	const knex = opts?.knex ?? getDatabase();
	const schema = await getSchema({ database: knex });

	const flowsService = new FlowsService({
		schema,
		knex,
	});

	const flows = await flowsService.readByQuery({
		fields: ['id', 'name'],
		filter: {
			status: {
				_eq: 'active',
			},
		},
		limit: -1,
	});

	return flows;
}

export async function countActiveFlows(opts?: { knex?: Knex | undefined }) {
	const flows = await getActiveFlows(opts);

	return flows.length;
}

export async function resolveFlows(flows: string[], ctx?: { accountability?: Accountability | undefined }) {
	const flowsService = new FlowsService({ schema: await getSchema(), accountability: ctx?.accountability });

	await Promise.allSettled(flows.map((flow_id) => flowsService.updateOne(flow_id, { status: 'inactive' })));
}
