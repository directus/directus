import type { Knex } from 'knex';
import { FlowsService } from '../../../services/flows.js';
import { getSchema } from '../../../utils/get-schema.js';

export async function getActiveFlows(opts?: { knex?: Knex | undefined }) {
    const flowsService = new FlowsService({
        schema: await getSchema(),
        knex: opts?.knex,
    });

    const flows = await flowsService.readByQuery({
        fields: ['id'],
        filter: {
            status: {
                _eq: 'active',
            }
        },
        limit: -1
    });

    return flows;
}

export async function countActiveFlows(opts?: { knex?: Knex | undefined }) {
    const flows = await getActiveFlows(opts);

    return flows.length;
}

export async function resolveFlows(flows: string[]) {
    const flowsService = new FlowsService({ schema: await getSchema() });

    await Promise.allSettled(flows.map((flow_id) => flowsService.updateOne(flow_id, { status: 'inactive' })));
}

