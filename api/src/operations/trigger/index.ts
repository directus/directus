import { defineOperationApi } from '@directus/shared/utils';
import { getFlowManager } from '../../flows';

type Options = {
	flow: string;
	data: string;
};

export default defineOperationApi<Options>({
	id: 'trigger',

	handler: async ({ flow, data }, context) => {
		const flowManager = getFlowManager();

		const parsedData = JSON.parse(data);

		let result: unknown | unknown[];

		if (Array.isArray(parsedData)) {
			result = await Promise.all(parsedData.map((data) => flowManager.runOperationFlow(flow, data, context)));
		} else {
			result = await flowManager.runOperationFlow(flow, parsedData, context);
		}

		return result;
	},
});
