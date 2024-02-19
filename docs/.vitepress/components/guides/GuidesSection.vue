<script setup lang="ts">
import { sections } from '@/data/guides';

type Keys = keyof typeof sections;
type Sections = (typeof sections)[Keys];

defineProps<{ section: Sections }>();
</script>

<template>
	<div class="boxes" :style="`column-count: ${section.cols}`">
		<div v-for="block of section.blocks" :key="block.title" class="box">
			<h3>{{ block.title }}</h3>
			<ul>
				<li v-for="item in block.items" :key="item.display">
					<a v-if="'path' in item" :href="item.path">{{ item.display }}</a>
					<span v-else>
						<span>{{ item.display }}:</span>
						<a v-for="variant of item.paths" :key="variant.path" :href="variant.path">{{ variant.label }}</a>
					</span>
				</li>
			</ul>
		</div>
	</div>
</template>

<style scoped>
.boxes {
	column-gap: 20px;
}
.box {
	break-inside: avoid;
	margin-bottom: 20px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	padding: 24px;
}
.box h2,
.box h3 {
	margin-top: 0;
	padding-top: 0;
	border: none;
}
.box ul {
	margin-bottom: 0;
}
.box a {
	font-weight: inherit;
}
.box li span a {
	margin-left: 0.5em;
}

@media screen and (max-width: 1200px) {
	.boxes {
		column-count: 1 !important;
	}
}
</style>
