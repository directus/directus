<script setup>
const props = defineProps({
	title: { type: String, required: true },
	h: { type: String, required: false, default: '2' },
	text: { type: String, required: true },
	icon: { type: String, required: false, default: "/icons/card_link.svg" },
	url: { type: String, required: false, default: null },
});

const tagType = props.url ? 'a' : 'div';
const headerType = 'h' + props.h;
</script>

<template>
	<component :is="tagType" :href="url" class="card" :class="{ 'no-icon': !icon }">
		<div v-if="icon" class="icon">
			<img v-if="icon" :src="icon" alt="" />
		</div>
		<div class="text">
			<component :is="headerType">{{ title }}</component>
			<p>{{ text }}</p>
		</div>
	</component>
</template>

<style scoped>
.card {
	border: 2px solid var(--vp-c-brand-light);
	border-radius: 8px;
	transition: border-color 0.25s, background-color 0.25s;
	padding: 1.5rem;
	color: inherit;
	display: grid;
	grid-template-columns: 44px auto;
	gap: 1.5em;
	margin-top: 1em;
	margin-bottom: 1em;
	box-shadow: 0 0 4px var(--vp-c-brand-light) ;
}

.card p {
	color: var(--vp-c-gray);
}
.card.no-icon {
	grid-template-columns: auto;
}

.card:hover {
	border: 2px solid var(--vp-c-brand);
	box-shadow: 0 0 8px var(--vp-c-brand) ;
	text-decoration: underline;
}
.icon {
	width: 44px;
}
img {
	border: none !important;
	width: auto;
	border-radius: 0 !important;
}

.vp-doc h2 {
	padding-top: 0;
	margin: 0;
	border: none;
}
.vp-doc h3 {
	margin-top: 0;
}
.vp-doc h2,
.vp-doc h3 {
	font-weight: 600;
	font-size: 1.25rem;
	margin-top: -0.25rem;
	margin-bottom: 0.25rem;
}
.vp-doc p {
	line-height: inherit;
	margin: 0;
}

@media screen and (max-width: 770px) {
	.card {
		grid-template-columns: auto;
		gap: 0;
	}
	.vp-doc h2,
	.vp-doc h3 {
		margin-top: 1em;
	}
}
</style>
