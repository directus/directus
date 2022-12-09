import { defineOperationApi, optionToObject } from '@directus/shared/utils';
import { omit } from 'lodash';
import { getFlowManager } from '../../flows';
import logger from '../../logger';

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

		let result: unknown | unknown[];

		if (Array.isArray(payloadObject)) {

			switch (iterationMode) {
				default:
				case 'serial': {
					result = [];

					for (const payload of payloadObject) {
						(result as any[]).push(await flowManager.runOperationFlow(flow, payload, omit(context, 'data')));
					}
					break
				}
				case 'batch': {

					const size = batchSize ?? 10;

					result = [];

					for(let i = 0; i < payloadObject.length; i += size) {
						const batch = payloadObject.slice(i, i + size);

						const batchResults = await Promise.all(batch.map((payload) => {
							return flowManager.runOperationFlow(flow, payload, omit(context, 'data'))
						}));
						
						
						(result as any[]).push(...batchResults)
					}

					break
				}
				case 'parallel': {
					result = await Promise.all(
						payloadObject.map((payload) => {
							return flowManager.runOperationFlow(flow, payload, omit(context, 'data'));
						})
					);
					break
				}
			}
			
		} else {
			result = await flowManager.runOperationFlow(flow, payloadObject, omit(context, 'data'));
		}

		return result;
	},
});