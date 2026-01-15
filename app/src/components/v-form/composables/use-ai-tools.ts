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
	setItem?: (item: Partial<FieldValues>) => void;
	values: ComputedRef<FieldValues>;
}

export const useAiTools = (options: UseAiToolsOptions) => {
	const { t } = useI18n();
	const { inputSchema: writeInputSchema } = useInputSchema(options.finalFields);

	const componentUid = getCurrentInstance()!.uid;

	defineTool({
		name: `read-form-values-${componentUid}`,
		displayName: t('ai_tools.read_form_values'),
		description: 'Read values of the form on the current page',
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
		description: `Set values of form on the current page`,
		inputSchema: writeInputSchema,
		execute: (args) => {
			const output: string[] = [];

			options.setItem?.(args);

			for (const [key, value] of Object.entries(args)) {
				options.setValue(key, value);
				output.push(`Successfully set form field ${key} to value ${value}`);
			}

			return output;
		},
	});
};
