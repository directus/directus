<template functional>
	<div class="raw-value">
		<div class="label">{{ props.label }}</div>
		<pre><slot /></pre>
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		label: {
			type: String,
			default: 'Value:',
		},
	},
});
</script>

<style scoped>
.raw-value {
	margin: 20px 0;
}

.label {
	margin-bottom: 4px;
	font-weight: 500;
}

pre {
	max-width: max-content;
	padding: 0.5rem;
	font-family: monospace;
	background-color: #eee;
	border-radius: 8px;
}
</style>
