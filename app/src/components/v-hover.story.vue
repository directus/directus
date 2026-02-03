<script setup lang="ts">
import VHover from './v-hover.vue';
</script>

<template>
	<Story title="VHover">
		<VHover v-slot="{ hover }">
			Hover me!
			<div v-if="hover">This is only shown on hover.</div>
		</VHover>
	</Story>
</template>
