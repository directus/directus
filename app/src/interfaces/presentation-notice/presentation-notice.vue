<template>
	<div class="presentation-notice">
		<v-notice :icon="icon" :type="color">
			<div v-md="text" />
		</v-notice>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		color: {
			type: String,
			default: 'normal',
		},
		icon: {
			type: String,
			default: 'info',
		},
		text: {
			type: String,
			default: 'No text configured...',
		},
	},
});
</script>

<style lang="scss" scoped>
:deep(a) {
	color: var(--primary);

	&:hover {
		color: var(--primary-125);
	}
}
</style>
