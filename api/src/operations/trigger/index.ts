import { defineOperationApi, optionToObject } from '@directus/shared/utils';
import { getFlowManager } from '../../flows';

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
			result = await Promise.all(
				payloadObject.map((payload) => {
					const updatedData = { $trigger: payload, $last: payload };
					return flowManager.runOperationFlow(flow, payload, { ...context, data: updatedData });
				})
			);
		} else {
			const updatedData = { $trigger: payload, $last: payload };
			result = await flowManager.runOperationFlow(flow, payloadObject, { ...context, data: updatedData });
		}

		return result;
	},
});
