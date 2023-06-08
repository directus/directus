<script setup lang="ts">
const props = defineProps({
	image: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
});
</script>
<template>
	<div class="avatar">
		<img :src="image" alt="" />
		<div>
			<p class="avatar_name">{{ name }}</p>
			<p class="avatar_title">{{ title }}</p>
		</div>
	</div>
</template>
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
}

.avatar > img {
	height: 2.5rem;
	width: 2.5rem;
	border-radius: 9999px;
	background-color: gray;
}

.avatar_name {
	font-weight: 600;
	color: black;
}

.avatar_title {
	color: gray;
}
</style>
