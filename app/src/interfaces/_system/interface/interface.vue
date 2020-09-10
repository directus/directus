<template>
	<v-select :items="items" @input="$listeners.input" :value="value" />
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import i18n from '@/lang';
import { getInterfaces } from '@/interfaces';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	setup() {
		const interfaces = getInterfaces();

		const items = computed(() => {
			return interfaces.value
				.filter((inter) => inter.relationship === undefined && inter.system !== true)
				.map((inter) => {
					return {
						text: inter.name,
						value: inter.id,
					};
				});
		});

		return { items };
	},
});
</script>
