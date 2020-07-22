<template>
	<v-modal :active="active" title="Test">
		{{ field }} {{ type }}
		<router-link to="/settings/data-model/customers">Back</router-link>
	</v-modal>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from '@vue/composition-api';

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			default: null,
		},
	},
	setup() {
		const active = ref(false);

		// This makes sure we still see the enter animation
		onMounted(() => {
			active.value = true;
		});

		return { active };
	},
});
</script>

<style lang="scss" scoped>

</style>
