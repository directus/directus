<template>
	<div class="filter-level" :class="{ root }">
		<v-select
			:placeholder="t('select')"
			:model-value="scope"
			@update:modelValue="$emit('update:scope', $event)"
			:items="scopeOptions"
			inline
			show-deselect
		/>

		<template v-if="scope === '_and' || scope === '_or'">
			<filter-level
				v-for="(level, index) in value ?? []"
				:key="index"
				:scope="Object.keys(level)[0]"
				:value="Object.values(level)[0]"
				:fields="fields"
				@update:scope="updateScope(index, $event)"
				@update:value="updateValue(index, $event)"
			/>

			<filter-level :fields="fields" @update:scope="addNewClause" />
		</template>

		<filter-field v-else-if="scope" :field="fields.find((f) => f.field === scope)" :value="value" />
	</div>
</template>

<script lang="ts">
import { Field, FieldFilter } from '@directus/shared/types';
import { computed } from '@vue/runtime-core';
import { defineComponent, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import FilterField from './filter-field.vue';

export default defineComponent({
	name: 'filter-level',
	props: {
		scope: {
			type: String,
			default: null,
		},
		value: {
			type: [Object, Array] as PropType<FieldFilter | FieldFilter[]>,
			default: null,
		},
		fields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
		root: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:scope', 'update:value'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const scopeOptions = computed(() => {
			const options = [
				{
					text: t('and'),
					value: '_and',
				},
				{
					text: t('or'),
					value: '_or',
				},
				{
					divider: true,
				},
			];

			options.push(
				...props.fields.map((field) => ({
					text: field.name,
					value: field.field,
				}))
			);

			return options;
		});

		return { scopeOptions, t, addNewClause, updateScope };

		function addNewClause(scope: string) {
			emit('update:value', [
				...((props.value as FieldFilter[]) ?? []),
				{
					[scope]: {
						_eq: '',
					},
				},
			]);
		}

		function updateScope(index: number, scope: string | null) {
			const currentValue = (props.value as FieldFilter[]) ?? [];

			if (scope === null) {
				emit('update:value', [...currentValue.slice(0, index), ...currentValue.slice(index + 1)]);
			} else {
				emit('update:value', [...currentValue.slice(0, index), { [scope]: {} }, ...currentValue.slice(index + 1)]);
			}
		}
	},
});
</script>

<style scoped>
.filter-level {
	padding-left: 8px;
}

.root {
	padding-left: 0;
}
</style>
