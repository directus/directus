<template>
	<div class="use-case">
		<a :href="url">
			<img :src="img" alt="" class="img-size" />
			<p class="tag">{{ tag }}</p>
			<h3 class="sub-headline">{{ title }}</h3>
			<p class="m-10">{{ desc }}</p>
		</a>
	</div>
</template>

<script>
export default {
	name: 'UseCase',
	props: {
		title: { type: String, required: true },
		tag: { type: String, required: true },
		desc: { type: String, required: true },
		url: { type: String, required: true },
		img: { type: String, required: true },
	},
};
</script>

<style scoped>
.use-case {
	color: inherit;
}
.img-size {
	width: 100%;
	object-fit: contain;
}
.tag {
	background: #f0ecff;
	border-radius: 6px;
	color: #6644ff;
	display: inline-block;
	font-size: 12px;
	font-weight: 500;
	margin: 12px 0;
	padding: 4px 8px;
}

.sub-headline {
	font-size: 18px;
	font-weight: 600;
}
</style>
