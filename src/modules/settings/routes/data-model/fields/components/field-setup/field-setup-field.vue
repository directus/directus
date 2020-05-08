<template>
	<div>
		<h2 class="type-title" v-if="isNew">{{ $t('field_setup_title') }}</h2>

		<div class="type-label">{{ $t('name') }}</div>
		<v-input
			class="field"
			:value="value.field"
			@input="emitValue('field', $event)"
			db-safe
			:disabled="isNew === false"
		/>

		<v-fancy-select
			:disabled="isNew === false"
			:items="items"
			:value="localType"
			@input="$emit('update:localType', $event)"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Field } from '@/stores/fields/types';
import { LocalType } from './types';
import i18n from '@/lang';
import { FancySelectItem } from '@/components/v-fancy-select/types';

export default defineComponent({
	props: {
		value: {
			type: Object as PropType<Field>,
			required: true,
		},
		localType: {
			type: String as PropType<LocalType>,
			default: null,
		},
		isNew: {
			type: Boolean,
			default: true,
		},
	},
	setup(props, { emit }) {
		const items = computed<FancySelectItem[]>(() => [
			{
				text: i18n.t('standard_field'),
				value: 'standard',
				icon: 'create',
			},
			{
				text: i18n.t('relational_field'),
				value: 'relational',
				icon: 'call_merge',
			},
			{
				text: i18n.t('single_file'),
				value: 'file',
				icon: 'photo',
			},
			{
				text: i18n.t('multiple_files'),
				value: 'files',
				icon: 'collections',
			},
		]);

		return { emitValue, items };

		function emitValue(key: string, value: any) {
			emit('input', {
				...props.value,
				[key]: value,
			});
		}
	},
});
</script>

<style lang="scss" scoped>
.field {
	--v-input-font-family: var(--family-monospace);

	margin-bottom: 48px;
}
</style>
