<script setup lang="ts">
import { useField } from 'vee-validate';
import Input from '~/components/ui/input/Input.vue';
import { Textarea } from '~/components/ui/textarea';
import CheckboxField from './fields/CheckboxField.vue';
import CheckboxGroupField from './fields/CheckboxGroupField.vue';
import RadioGroupField from './fields/RadioGroupField.vue';
import SelectField from './fields/SelectField.vue';
import FileUploadField from './fields/FileUploadField.vue';
import { Info } from 'lucide-vue-next';
import type { FormField } from '../../../shared/types/schema';

const props = defineProps<{ field: FormField }>();
const { value, errorMessage } = useField(props.field.name ?? '');

const componentMap: Record<string, any> = {
	textarea: Textarea,
	checkbox: CheckboxField,
	checkbox_group: CheckboxGroupField,
	radio: RadioGroupField,
	select: SelectField,
	file: FileUploadField,
};

const getFieldComponent = () => componentMap[props.field.type ?? ''] || Input;

const getComponentProps = (field: FormField) => {
	const baseProps = {
		id: field.id,
		name: field.name ?? '',
		placeholder: field.placeholder ?? '',
		modelValue: value.value,
		'onUpdate:modelValue': (val: any) => (value.value = val),
	};

	if (['checkbox_group', 'radio', 'select'].includes(field.type ?? '')) {
		return { ...baseProps, options: field.choices ?? [] };
	}

	if (field.type === 'checkbox') {
		return { ...baseProps, label: field.label ?? '' };
	}

	return baseProps;
};
</script>

<template>
	<div v-if="props.field.type !== 'hidden'" :class="`field-width-${field.width ?? '100'}`">
		<FormItem class="pt-2">
			<FormLabel :for="field.name ?? ''" class="flex items-center justify-between">
				<div class="flex items-center space-x-1 h-[20px]">
					<span v-if="field.type !== 'checkbox'">{{ field.label ?? '' }}</span>
					<TooltipProvider v-if="field.help">
						<Tooltip>
							<TooltipTrigger>
								<Info class="w-4 h-4 text-gray-500 cursor-pointer" />
							</TooltipTrigger>
							<TooltipContent>{{ field.help }}</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				<span v-if="field.required" class="text-sm text-gray-400">*Required</span>
			</FormLabel>
			<FormControl class="h-10">
				<component :is="getFieldComponent()" v-bind="getComponentProps(field)" />
			</FormControl>
			<FormMessage v-if="errorMessage" class="text-red-500 italic text-sm">{{ errorMessage }}</FormMessage>
		</FormItem>
	</div>
</template>

<style scoped>
.field-width-100 {
	flex: 100%;
}
.field-width-50 {
	flex: calc(50% - 1rem);
}
.field-width-67 {
	flex: calc(67% - 1rem);
}
.field-width-33 {
	flex: calc(33% - 1rem);
}
</style>
