<template>
	<div>
		<h2 class="type-title" v-if="isNew">{{ $t('field_setup_title') }}</h2>

		<div class="type-label">
			{{ $t('name') }}
			<v-icon class="required" sup name="star" />
		</div>
		<v-input
			class="field"
			:value="value.field"
			@input="emitValue('field', $event)"
			db-safe
			:disabled="isNew === false"
		/>

		<v-fancy-select :disabled="isNew === false" :items="items" :value="localType" @input="setLocalType" />
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

		return { emitValue, items, setLocalType };

		function emitValue(key: string, value: any) {
			emit('input', {
				...props.value,
				[key]: value,
			});
		}

		function setLocalType(newType: string) {
			emit('update:localType', newType);

			// Reset the interface when changing the localtype. If you change localType, the previously
			// selected interface most likely doesn't exist in the new selection anyways
			emit('input', {
				...props.value,
				interface: null,
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

.required {
	color: var(--primary);
}
</style>
