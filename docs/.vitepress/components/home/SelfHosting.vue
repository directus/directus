<template>
	<div class="self-hosting">
		<img :src="img" alt="" class="sh-img-size" />
		<h3 class="sub-headline m-10">{{ title }}</h3>
		<p>{{ desc }}</p>
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

<style>
img {
	max-width: unset;
}
.self-hosting {
	width: full;
	max-width: 290px;
}
.sh-img-size {
	width: full;
	max-height: 220px;
	object-fit: cover;
}

.sub-headline {
	font-size: 18px;
	font-weight: 600;
}

.outline-btn {
	display: inline-block;
	border: 1px solid;
	border-color: #e8e9ea;
	border-radius: 8px;
	color: black;
	font-weight: 500;
	margin-top: 20px;
	padding: 12px;
}
</style>
