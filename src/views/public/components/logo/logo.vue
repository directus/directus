<template functional>
	<a href="https://directus.io" rel="noopener noreferrer" target="_blank" class="logo">
		<img
			v-tooltip.right.inverted="`Directus v${props.version}`"
			alt="Directus Logo"
			src="./logo-dark.svg"
		/>
	</a>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		version: {
			type: String,
			required: true,
		},
	},
});
</script>
