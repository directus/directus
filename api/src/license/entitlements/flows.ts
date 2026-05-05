import { FlowsService } from '../../services/flows.js';
import { getSchema } from '../../utils/get-schema.js';
import { entitlementManager } from './manager.js';

async function countActiveFlows() {
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

    return flows.length;
}

entitlementManager.registerCounter('flows', countActiveFlows);