<script setup lang="ts">
import VHover from './v-hover.vue';
</script>

<template>
	<Story title="VHover" icon="material-symbols:tooltip">
		<v-hover v-slot="{ hover }">
			Hover me!
			<div v-if="hover">This is only shown on hover.</div>
		</v-hover>
	</Story>
</template>
