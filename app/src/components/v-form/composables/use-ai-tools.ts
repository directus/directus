import type { Field } from '@directus/types';
import type { ComputedRef } from 'vue';
import { computed, getCurrentInstance, Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';
import type { FieldValues } from '../types';
import { useInputSchema } from './use-input-schema';
import { defineTool } from '@/ai/composables/define-tool';

interface UseAiToolsOptions {
	finalFields: Ref<Field[]>;
	fieldNames: Ref<string[]>;
	setValue: (key: string, value: unknown) => void;
	values: ComputedRef<FieldValues>;
}

export const useAiTools = (options: UseAiToolsOptions) => {
	const { t } = useI18n();
	const { inputSchema: writeInputSchema } = useInputSchema(options.finalFields);

	const componentUid = getCurrentInstance()!.uid;

	defineTool({
		name: `read-form-values-${componentUid}`,
		displayName: t('ai_tools.read_form_values'),
		description:
			'Read values from the form currently open in the UI. Returns only field values visible in the current form view. Does NOT query the database — use the items tool for that.',
		inputSchema: computed(() => {
			return z.object({
				fields: options.fieldNames.value.length > 0 ? z.array(z.enum(options.fieldNames.value)) : z.array(z.string()),
			});
		}),
		execute: ({ fields }) => {
			const output: Record<string, unknown> = {};

			for (const field of fields) {
				output[field] = options.values.value[field];
			}

			return output;
		},
	});

	defineTool({
		name: `set-form-values-${componentUid}`,
		displayName: t('ai_tools.update_form_values'),
		description:
			"Update field values in the form currently open in the UI. Changes are local until the user saves. Does NOT update the database — use the items tool with action: 'update' for that.",
		inputSchema: writeInputSchema,
		execute: (args) => {
			const output: string[] = [];

			for (const [key, value] of Object.entries(args)) {
				options.setValue(key, value);
				output.push(`Successfully set form field ${key} to value ${value}`);
			}

			return output;
		},
	});
};
