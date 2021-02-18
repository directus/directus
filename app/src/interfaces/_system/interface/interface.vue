<template>
	<v-notice v-if="selectedType === undefined">
		{{ $t('select_field_type') }}
	</v-notice>
	<v-select
		v-else
		:items="items"
		@input="$listeners.input"
		:value="value"
		:placeholder="$t('interfaces.interface.placeholder')"
	/>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, inject, ref, watch } from '@vue/composition-api';
import i18n from '@/lang';
import { getInterfaces } from '@/interfaces';
import { types } from '@/types';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		typeField: {
			type: String,
			default: null,
		},
	},
	setup(props, { emit }) {
		const interfaces = getInterfaces();

		const values = inject('values', ref<Record<string, any>>({}));

		const selectedType = computed(() => {
			if (props.typeField === null || !values.value[props.typeField]) return;
			return values.value[props.typeField];
		});

		watch(
			() => values.value[props.typeField],
			() => {
				emit('input', null);
			}
		);

		const items = computed(() => {
			return interfaces.value
				.filter((inter) => inter.relational !== true && inter.system !== true)
				.filter((inter) => selectedType.value === undefined || inter.types.includes(selectedType.value))
				.map((inter) => {
					return {
						text: inter.name,
						value: inter.id,
					};
				});
		});

		return { items, selectedType, values };
	},
});
</script>
