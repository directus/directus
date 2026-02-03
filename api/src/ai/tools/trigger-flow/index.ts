import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { InvalidPayloadError } from '@directus/errors';
import { z } from 'zod';
import { getFlowManager } from '../../../flows.js';
import { FlowsService } from '../../../services/flows.js';
import { requireText } from '../../../utils/require-text.js';
import { defineTool } from '../define-tool.js';
import { TriggerFlowInputSchema, TriggerFlowValidateSchema } from '../schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const triggerFlow = defineTool<z.infer<typeof TriggerFlowValidateSchema>>({
	name: 'trigger-flow',
	description: requireText(resolve(__dirname, './prompt.md')),
	annotations: {
		title: 'Directus - Trigger Flow',
	},
	inputSchema: TriggerFlowInputSchema,
	validateSchema: TriggerFlowValidateSchema,
	async handler({ args, schema, accountability }) {
		const flowsService = new FlowsService({ schema, accountability });

		const flow = await flowsService.readOne(args.id, {
			filter: { status: { _eq: 'active' }, trigger: { _eq: 'manual' } },
			fields: ['options'],
		});

		/**
		 * Collection and Required selection are validated by the server.
		 * Required fields is an additional validation we do.
		 */
		const requiredFields = ((flow.options?.['fields'] as { field: string; meta: { required: boolean } }[]) ?? [])
			.filter((field) => field.meta?.required)
			.map((field) => field.field);

		for (const fieldName of requiredFields) {
			if (!args.data || !(fieldName in args.data)) {
				throw new InvalidPayloadError({ reason: `Required field "${fieldName}" is missing` });
			}
		}

		const flowManager = getFlowManager();

		const { result } = await flowManager.runWebhookFlow(
			`POST-${args.id}`,
			{
				path: `/trigger/${args.id}`,
				query: args.query ?? {},
				method: 'POST',
				body: {
					collection: args.collection,
					keys: args.keys,
					...(args.data ?? {}),
				},
				headers: args.headers ?? {},
			},
			{ accountability, schema },
		);

		return { type: 'text', data: result };
	},
});
