<template>
	<v-card>
		<v-card-title>Add collection modal</v-card-title>
		<v-card-actions>
			<v-button secondary @click="cancel">Cancel</v-button>
		</v-card-actions>
	</v-card>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	setup(props, { emit }) {
		return { cancel };

		function cancel() {
			emit('cancel');
		}
	},
});
</script>
