<template functional>
	<a href="https://directus.io" target="_blank" class="logo">
		<img
			v-tooltip.right="{ classes: ['inverted'], content: `Directus v${props.version}` }"
			alt="Directus Logo"
			src="../../assets/logo-dark.svg"
		/>
	</a>
</template>

<script lang="ts">
import { version } from '../../../package.json';
import { createComponent } from '@vue/composition-api';

export default createComponent({
	props: {
		version: {
			type: String,
			required: true
		}
	}
});
</script>
