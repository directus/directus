<script setup lang="ts">
import { computed } from 'vue';

interface CardProps {
	title: string;
	h?: '1' | '2' | '3' | '4' | '5';
	text: string;
	icon?: string;
	url?: string;
}

const props = withDefaults(defineProps<CardProps>(), {
	h: '2',
	icon: 'link',
});

const tagType = computed(() => (props.url ? 'a' : 'div'));
const headerType = computed(() => 'h' + props.h);
const iconIsImage = computed(() => props.icon.startsWith('/'));
</script>

<template>
	<component :is="tagType" :href="url" class="card" :class="{ 'no-icon': !icon }">
		<div v-if="icon" class="icon">
			<img v-if="iconIsImage" :src="icon" alt="" />
			<span mi else>{{ icon }}</span>
		</div>

		<div class="text">
			<component :is="headerType">{{ title }}</component>
			<p>{{ text }}</p>
		</div>
	</component>
</template>

<style scoped>
.card {
	display: flex;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	padding: 24px;
	width: 100%;
	height: 100%;
	transition: border-color 0.25s;
	gap: 20px;
}

.card:hover {
	border-color: var(--vp-c-brand);
	text-decoration: none;
}

.icon {
	width: 54px;
	height: 54px;
	background: var(--vp-c-purple-dimm-3);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.icon span[mi] {
	font-size: 24px;
	font-variation-settings: 'opsz' 24, 'wght' 500;
	color: var(--vp-c-purple);
}

h1,
h2,
h3,
h4,
h5 {
	font-size: 16px;
	font-weight: 600;
	line-height: 24px;
	padding: 0;
	margin: 0;
	border: none;
	color: var(--vp-c-text-1);
	margin-bottom: 4px;
}

p {
	font-size: 14px;
	margin: 0;
	padding: 0;
	color: var(--vp-c-text-2);
	line-height: 22px;
}
</style>
