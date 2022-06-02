import { defineOperationApi } from '@directus/shared/utils';
import { getFlowManager } from '../../flows';
import { optionToObject } from '../../utils/operation-options';

type Options = {
	flow: string;
	payload?: Record<string, any> | Record<string, any>[] | string | null;
};

export default defineOperationApi<Options>({
	id: 'trigger',

	handler: async ({ flow, payload }, context) => {
		const flowManager = getFlowManager();

		const payloadObject = optionToObject(payload) ?? null;

		let result: unknown | unknown[];

		if (Array.isArray(payloadObject)) {
			result = await Promise.all(payloadObject.map((payload) => flowManager.runOperationFlow(flow, payload, context)));
		} else {
			result = await flowManager.runOperationFlow(flow, payloadObject, context);
		}

		return result;
	},
});
