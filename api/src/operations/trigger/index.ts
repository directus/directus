import { defineOperationApi } from '@directus/shared/utils';
import { getFlowManager } from '../../flows';

type Options = {
	flow: string;
	data: string;
	multiple: boolean;
};

export default defineOperationApi<Options>({
	id: 'trigger',

	handler: async ({ flow, data, multiple }, context) => {
		const flowManager = getFlowManager();

		const parsedData = JSON.parse(data);

		let result: unknown | unknown[];

		if (multiple && Array.isArray(parsedData)) {
			result = await Promise.all(parsedData.map((data) => flowManager.runOperationFlow(flow, data, context)));
		} else {
			result = await flowManager.runOperationFlow(flow, parsedData, context);
		}

		return result;
	},
});
