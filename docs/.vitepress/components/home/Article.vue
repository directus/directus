<template>
	<div class="vp-docs">
		<a :href="url">
			<img :src="img" alt="" class="article-img" />
			<p class="tag">{{ tag }}</p>
			<h3 class="sub-headline article-heading">{{ title }}</h3>
			<div class="m-10 gray">
				<span>{{ author }}</span>
				&nbsp;
				<span>•</span>
				&nbsp;
				<span>{{ date }}</span>
			</div>
		</a>
	</div>
</template>

<script>
export default {
	name: 'Article',
	props: {
		title: { type: String, required: true },
		tag: { type: String, required: true },
		url: { type: String, required: true },
		img: { type: String, required: true },
		author: { type: String, required: true },
		date: { type: String, required: true },
	},
};
</script>

<style scoped>
.article-heading {
	font-weight: 600;
}
.article-img {
	width: 100%;
	object-fit: contain;
	border-radius: 8px;
}
.tag {
	background: #f0ecff;
	text-transform: capitalize;
	border-radius: 6px;
	color: #6644ff;
	display: inline-block;
	font-size: 12px;
	font-weight: 500;
	margin: 12px 0;
	padding: 4px 8px;
}
.gray {
	color: #747a82;
}
</style>
