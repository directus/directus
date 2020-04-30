<template>
	<v-tab-item value="field">
		<h2 class="title" v-if="isNew">{{ $t('field_setup_title') }}</h2>

		<label for="name" class="label">{{ $t('name') }}</label>
		<v-input
			:disabled="isNew === false"
			id="name"
			v-model="_field"
			:placeholder="$t('enter_field_name')"
		/>

		<v-fancy-select :disabled="isNew === false" :items="items" v-model="_type" />
	</v-tab-item>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import useSync from '@/composables/use-sync/';
import { FieldType } from './types';
import { FancySelectItem } from '@/components/v-fancy-select/types';
import { i18n } from '@/lang';

export default defineComponent({
	props: {
		field: {
			type: String,
			default: null,
		},
		type: {
			type: String as PropType<FieldType>,
			default: null,
			validator: (val: string) => ['standard', 'relational', 'file', 'files'].includes(val),
		},
		isNew: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const _field = useSync(props, 'field', emit);
		const _type = useSync(props, 'type', emit);

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

		return { _field, _type, items };
	},
});
</script>

<style lang="scss" scoped>
.v-input {
	margin-bottom: 48px;
}
</style>
