<template>
	<iframe :src="url === 'loading.html' ? url : url + '/admin/'" frameborder="0" class="browser"></iframe>
</template>

<script setup lang="ts">
defineProps<{
	url: string;
}>();
</script>

<style scoped lang="scss">
.browser {
	width: 100%;
	height: 100%;
}
</style>
