<script setup lang="ts">
import { sections } from '@/data/guides.js';

const props = defineProps<{
	type: string;
}>();

const extensionsGuides = sections.extensions;
const section = extensionsGuides.blocks.find((b) => b.title == props.type);
const guides = section?.items;
</script>

<template>
	<ul>
		<li v-for="item in guides" :key="item.path">
			<a :href="item.path">{{ item.display }}</a>
		</li>
	</ul>
</template>
