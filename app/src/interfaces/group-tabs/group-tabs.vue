<script setup lang="ts">
import { Field, ValidationError } from '@directus/types';
import { isEqual } from 'lodash';
import { computed, ref, watch } from 'vue';
import { TabsList, TabsRoot } from 'reka-ui';
import TabTrigger from './tab-trigger.vue';
import TabContent from './tab-content.vue';
import type { ComparisonContext } from '@/components/v-form/types';
import { CollabContext } from '@/composables/use-collab';
import { getFieldsInGroup } from '@/utils/get-fields-in-group';

const props = withDefaults(
	defineProps<{
		field: Field;
		fields: Field[];
		values: Record<string, unknown>;
		initialValues: Record<string, unknown>;
		disabled?: boolean;
		nonEditable?: boolean;
		batchMode?: boolean;
		batchActiveFields?: string[];
		collabContext?: CollabContext;
		comparison?: ComparisonContext;
		primaryKey: string | number;
		loading?: boolean;
		validationErrors?: ValidationError[];
		badge?: string;
		rawEditorEnabled?: boolean;
		direction?: string;
		fillWidth?: boolean;
	}>(),
	{
		batchActiveFields: () => [],
		validationErrors: () => [],
		fillWidth: false,
	},
);

defineEmits<{
	(e: 'apply', value: Record<string, unknown>): void;
}>();

const { groupFields, groupValues } = useComputedGroup();

const visibleFields = computed(() => groupFields.value.filter((field) => !field.meta?.hidden));

const activeTab = ref(visibleFields.value[0]?.field ?? '');

watch(visibleFields, (newFields) => {
	if (newFields.length > 0 && !newFields.some((f) => f.field === activeTab.value)) {
		activeTab.value = newFields[0]!.field;
	}
});

watch(
	() => props.validationErrors,
	(newVal, oldVal) => {
		if (!props.validationErrors) return;
		if (isEqual(newVal, oldVal)) return;

		const tabWithError = visibleFields.value.find((tabField) => {
			const nested = getFieldsInGroup(tabField.field, props.fields);

			return props.validationErrors!.some(
				(err) => err.field === tabField.field || nested.some((f) => f.field === err.field),
			);
		});

		if (tabWithError) {
			activeTab.value = tabWithError.field;
		}
	},
);

function useComputedGroup() {
	const groupFields = ref<Field[]>(limitFields());
	const groupValues = ref<Record<string, any>>(props.values);

	watch(
		() => props.fields,
		() => {
			const newVal = limitFields();

			if (!isEqual(groupFields.value, newVal)) {
				groupFields.value = newVal;
			}
		},
	);

	watch(
		() => props.values,
		(newVal) => {
			if (!isEqual(groupValues.value, newVal)) {
				groupValues.value = newVal;
			}
		},
	);

	return { groupFields, groupValues };

	function limitFields(): Field[] {
		return props.fields.filter((field) => field.meta?.group === props.field.meta?.field);
	}
}
</script>

<template>
	<TabsRoot
		v-if="visibleFields.length > 0"
		v-model="activeTab"
		class="group-tabs"
		:class="{ fill: fillWidth }"
		:dir="direction as 'ltr' | 'rtl'"
	>
		<TabsList class="tab-list">
			<TabTrigger
				v-for="tabField in visibleFields"
				:key="tabField.field"
				:field="tabField"
				:fields="fields"
				:values="groupValues"
				:validation-errors="validationErrors"
				:comparison="comparison"
				:badge="badge"
			/>
		</TabsList>

		<TabContent
			v-for="tabField in visibleFields"
			:key="tabField.field"
			:field="tabField"
			:fields="fields"
			:values="groupValues"
			:initial-values="initialValues"
			:disabled="disabled"
			:non-editable="nonEditable"
			:batch-mode="batchMode"
			:batch-active-fields="batchActiveFields"
			:comparison="comparison"
			:collab-context="collabContext"
			:primary-key="primaryKey"
			:loading="loading"
			:validation-errors="validationErrors"
			:raw-editor-enabled="rawEditorEnabled"
			:group="field.meta?.field ?? ''"
			:direction="direction"
			@apply="$emit('apply', $event)"
		/>
	</TabsRoot>
</template>

<style lang="scss" scoped>
.tab-list {
	display: flex;
	gap: 0 0.5rem;
	padding: 2px;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background-subdued);
	flex-wrap: wrap;
}
</style>
