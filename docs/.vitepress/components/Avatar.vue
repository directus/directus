<template>
	<div class="avatar">
		<img :src="image" alt="" />
		<div>
			<p class="avatar_name">{{ name }}</p>
			<p class="avatar_title">{{ title }}</p>
		</div>
	</div>
</template>
<script setup lang="ts">
defineProps<{
	image: string;
	name: string;
	title: string;
}>();
</script>
<style scoped>
.avatar {
	position: relative;
	display: flex;
	align-items: center;
	column-gap: 1rem;
	font-size: 0.875rem;
}

.avatar p {
	margin: 0;
	line-height: normal;
}

.avatar > img {
	height: 2.5rem;
	object-fit: cover;
	object-position: top;
	width: 2.5rem;
	border-radius: 9999px;
	background-color: gray;
}

.avatar_name {
	font-weight: 700;
}

.avatar_title {
}
</style>
