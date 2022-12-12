import { defineOperationApi, optionToObject } from '@directus/shared/utils';
import { omit } from 'lodash';
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
					return flowManager.runOperationFlow(flow, payload, omit(context, 'data'));
				})
			);
		} else {
			result = await flowManager.runOperationFlow(flow, payloadObject, omit(context, 'data'));
		}

		return result;
	},
});
