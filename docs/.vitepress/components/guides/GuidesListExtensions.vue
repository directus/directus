<script setup lang="ts">
import { data } from '../../data/guides.data.js';

const props = defineProps<{
	type: string;
}>();

const extensionsGuides = data.guides.sections.find((s) => s.indexPath == 'extensions');
const section = extensionsGuides.blocks.find((b) => b.title == props.type);
const guides = section.items;
</script>

<template>
	<ul>
		<li v-for="item in guides" :key="item.path">
			<a :href="item.path">{{ item.display }}</a>
		</li>
	</ul>
</template>
