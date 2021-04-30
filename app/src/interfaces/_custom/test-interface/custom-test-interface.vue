<template>
	<div>
		<h1>Custom Test Interface!</h1>
	</div>
</template>
<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	setup() {
		console.log("hello! I'm a custom interface!");
	},
});
</script>
