<template>
	<div>
		<h2 class="type-title" v-if="isNew">{{ $t('relationship_setup_title') }}</h2>
		<v-fancy-select :items="items" :value="value.type" @input="emitValue('type', $event)" />

		<many-to-one
			v-if="value.type === 'm2o'"
			:collection="value.collection"
			:field="value"
			@update:field="emit('input', $event)"
		/>
		<one-to-many
			v-else-if="value.type === 'o2m'"
			:collection="value.collection"
			:field="value"
			@update:field="emit('input', $event)"
		/>
		<many-to-many
			v-else-if="value.type === 'm2m'"
			:collection="value.collection"
			:field="value"
			@update:field="emit('input', $event)"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { FancySelectItem } from '@/components/v-fancy-select/types';
import { Field } from '@/stores/fields/types';
import i18n from '@/lang';
import ManyToOne from './field-setup-relationship-m2o.vue';
import OneToMany from './field-setup-relationship-o2m.vue';
import ManyToMany from './field-setup-relationship-m2m.vue';

export default defineComponent({
	components: {
		ManyToOne,
		OneToMany,
		ManyToMany,
	},
	props: {
		isNew: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Object as PropType<Field>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const items = computed<FancySelectItem[]>(() => {
			return [
				{
					text: i18n.t('many_to_one'),
					value: 'm2o',
					icon: 'call_merge',
				},
				{
					text: i18n.t('one_to_many'),
					value: 'o2m',
					icon: 'call_split',
				},
				{
					text: i18n.t('many_to_many'),
					value: 'm2m',
					icon: 'compare_arrows',
				},
			];
		});

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
