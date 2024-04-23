<script setup>
const props = defineProps({
	product: {
		type: String,
		required: true
	},
	compact: {
		type: Boolean,
		default: true
	}
})

const products = {
	connect: {
		name: 'Connect',
		path: '/connect/quickstart',
		icon: '/img/products/connect.svg'
	},
	auth: {
		name: 'Auth',
		path: '/auth/quickstart',
		icon: '/img/products/auth.svg'
	},
	realtime: {
		name: 'Realtime',
		path: '/realtime/quickstart',
		icon: '/img/products/realtime.svg'
	},
	automate: {
		name: 'Automate',
		path: '/automate/quickstart',
		icon: '/img/products/automate.svg'
	},
	explore: {
		name: 'Explore',
		path: '/user-guide/explore/quickstart',
		icon: '/img/products/explore.svg'
	},
	editor: {
		name: 'Editor',
		path: '/user-guide/editor/quickstart',
		icon: '/img/products/editor.svg'
	},
	files: {
		name: 'Files',
		path: '/user-guide/files/quickstart',
		icon: '/img/products/files.svg'
	},
	insights: {
		name: 'Insights',
		path: '/user-guide/insights/quickstart',
		icon: '/img/products/insights.svg'
	},
}

const product = products[props.product]
</script>

<template>
	<NuxtLink :to="product.path">
		<img :src="product.icon" alt="">
		<span>{{ compact ? product.name : 'Directus ' + product.name }}</span>
	</NuxtLink>
</template>

<style scoped lang="scss">
a {
	display: inline-block;
	justify-content: flex-start;
	align-items: center;
	text-decoration: none;
	img {
		position: relative;
		display: inline;
		height: 1rem;
		width: auto;
		border-radius: 0;
		margin-bottom: 0;
		top: 2px;
	}
	span {
		display: inline;
		margin-left: 0.3rem;
		font-family: var(--font--header);
		font-weight: 500;
		background-color: var(--typography);
		background-image: linear-gradient(45deg, var(--primary), var(--secondary));
		background-size: 100%;
  		background-repeat: repeat;
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		-moz-background-clip: text;
		-moz-text-fill-color: transparent;
	}
}
</style>
