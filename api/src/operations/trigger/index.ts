import { defineOperationApi } from '@directus/extensions';
import { optionToObject } from '@directus/utils';
import { omit } from 'lodash-es';
import { getFlowManager } from '../../flows.js';

type Options = {
	flow: string;
	payload?: Record<string, any> | Record<string, any>[] | string | null;
	iterationMode?: 'serial' | 'batch' | 'parallel';
	batchSize?: number;
};

export default defineOperationApi<Options>({
	id: 'trigger',

	handler: async ({ flow, payload, iterationMode, batchSize }, context) => {
		const flowManager = getFlowManager();

		const payloadObject = optionToObject(payload) ?? null;

		if (Array.isArray(payloadObject)) {
			if (iterationMode === 'serial') {
				const result = [];

				for (const payload of payloadObject) {
					result.push(await flowManager.runOperationFlow(flow, payload, omit(context, 'data')));
				}

				return result;
			}

			if (iterationMode === 'batch') {
				const size = batchSize ?? 10;

				const result = [];

				for (let i = 0; i < payloadObject.length; i += size) {
					const batch = payloadObject.slice(i, i + size);

					const batchResults = await Promise.all(
						batch.map((payload) => {
							return flowManager.runOperationFlow(flow, payload, omit(context, 'data'));
						})
					);

					result.push(...batchResults);
				}

				return result;
			}

			if (iterationMode === 'parallel' || !iterationMode) {
				return await Promise.all(
					payloadObject.map((payload) => {
						return flowManager.runOperationFlow(flow, payload, omit(context, 'data'));
					})
				);
			}
		}

		return await flowManager.runOperationFlow(flow, payloadObject, omit(context, 'data'));
	},
});
