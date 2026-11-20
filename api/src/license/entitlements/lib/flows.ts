import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import getDatabase from '../../../database/index.js';
import { FlowsService } from '../../../services/flows.js';
import { getSchema } from '../../../utils/get-schema.js';
import { settleIds } from '../utils/settle-ids.js';

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

export async function resolveFlows(
	flows: string[],
	ctx?: { accountability?: Accountability | undefined },
): Promise<string[]> {
	const flowsService = new FlowsService({ schema: await getSchema(), accountability: ctx?.accountability });

	const active = await flowsService.readByQuery({
		fields: ['id'],
		filter: { _and: [{ id: { _in: flows } }, { status: { _eq: 'active' } }] },
		limit: -1,
	});

	return settleIds(
		active.map((flow) => String(flow.id)),
		(flowId) => flowsService.updateOne(flowId, { status: 'inactive' }),
	);
}

export async function restoreFlows(flows: string[], ctx: { accountability: Accountability | null }): Promise<string[]> {
	const flowsService = new FlowsService({ schema: await getSchema(), accountability: ctx.accountability });

	return settleIds(flows, (flowId) => flowsService.updateOne(flowId, { status: 'active' }));
}
