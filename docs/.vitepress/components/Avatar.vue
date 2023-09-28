<script setup lang="ts">
defineProps<{
	image: string;
	name: string;
	title: string;
}>();
</script>

<template>
	<div class="avatar">
		<img :src="image" :alt="name" />
		<div>
			<div class="avatar_name">{{ name }}</div>
			<div>{{ title }}</div>
		</div>
	</div>
</template>

<style scoped>
.avatar {
	position: relative;
	display: flex;
	align-items: center;
	column-gap: 1rem;
}

.avatar > img {
	height: 2.5rem;
	object-fit: cover;
	object-position: top;
	width: 2.5rem;
	border-radius: 9999px;
	background-color: var(--vp-c-gray);
}

.avatar_name {
	font-weight: 700;
}
</style>
