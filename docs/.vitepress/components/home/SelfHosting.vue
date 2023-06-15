<template>
	<div class="sh">
		<img :src="img" alt="" class="sh-img" />
		<h3 class="sh-title">{{ title }}</h3>
		<p class="text-muted">{{ desc }}</p>
		<a :href="url" class="outline-btn">Read More</a>
	</div>
</template>

<script>
export default {
	name: 'SelfHosting',
	props: {
		title: { type: String, required: true },
		desc: { type: String, required: true },
		url: { type: String, required: true },
		img: { type: String, required: true },
	},
};
</script>

<style scoped>
.sh-img {
	width: 100%;
	max-height: 220px;
	object-fit: cover;
	border-radius: 10px;
}

.sh-title {
	font-size: 18px;
	font-weight: 600;
	margin-top: 20px;
	margin-bottom: 10px;
}
</style>
