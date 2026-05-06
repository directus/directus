import { FlowsService } from '../../../services/flows.js';
import { getSchema } from '../../../utils/get-schema.js';

export async function getActiveFlows() {
    const flowsService = new FlowsService({
        schema: await getSchema(),
    });

    const flows = await flowsService.readByQuery({
        fields: ['id'],
        filter: {
            status: {
                _eq: 'active',
            }
        }
    });

    return flows;
}

export async function countActiveFlows() {
    const flows = await getActiveFlows();

    return flows.length;
}

export async function resolveFlows(flows: string[]) {
    const flowsService = new FlowsService({ schema: await getSchema() });

    try {
        await Promise.allSettled(flows.map((flow_id) => flowsService.updateOne(flow_id, { status: 'inactive' })));
    } catch {
        // ignore errors
    }
}