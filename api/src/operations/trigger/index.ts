import { defineOperationApi } from '@directus/shared/utils';
import { getFlowManager } from '../../flows';
import { parseJSON } from '../../utils/parse-json';

type Options = {
	flow: string;
	payload: string;
};

export default defineOperationApi<Options>({
	id: 'trigger',

	handler: async ({ flow, payload }, context) => {
		const flowManager = getFlowManager();

		const parsedData = parseJSON(payload);

		let result: unknown | unknown[];

		if (Array.isArray(parsedData)) {
			result = await Promise.all(parsedData.map((payload) => flowManager.runOperationFlow(flow, payload, context)));
		} else {
			result = await flowManager.runOperationFlow(flow, parsedData, context);
		}

		return result;
	},
});
