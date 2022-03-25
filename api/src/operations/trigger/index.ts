import { defineOperationApi } from '@directus/shared/utils';
import { getFlowManager } from '../../flows';

type Options = {
	flows: {flow: string, data: string}[];
};

export default defineOperationApi<Options>({
	id: 'trigger',

	handler: async ({ flows }, context) => {
		const flowManager = getFlowManager();

		return await Promise.all(flows.map(({flow, data}) => flowManager.runOperationFlow(flow, JSON.parse(data), context)));
	},
});
