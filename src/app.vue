<template>
	<div>
		<h1>Hello, world!</h1>
		<p>{{ date }}</p>
	</div>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';
export default createComponent({
	setup() {
		const date = new Date();
		return { date };
	}
});
</script>
