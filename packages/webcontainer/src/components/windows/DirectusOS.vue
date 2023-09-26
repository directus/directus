<template>
	<iframe :src="url" frameborder="0" class="browser"></iframe>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const url = computed(() => {
	return window.location.href;
});
</script>

<style scoped lang="scss">
.browser {
	width: 100%;
	height: 100%;
}
</style>
