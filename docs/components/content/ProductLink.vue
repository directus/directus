<script setup>
const props = defineProps({
	product: {
		type: String,
		required: true
	},
	compact: {
		type: Boolean
	}
})

const products = {
	connect: {
		name: 'Connect',
		path: '/connect/quickstart'
	},
	auth: {
		name: 'Auth',
		path: '/auth/quickstart'
	},
	realtime: {
		name: 'Realtime',
		path: '/realtime/quickstart'
	},
	automate: {
		name: 'Automate',
		path: '/automate/quickstart'
	},
	explore: {
		name: 'Explore',
		path: '/user-guide/explore/quickstart'
	},
	editor: {
		name: 'Editor',
		path: '/user-guide/editor/quickstart'
	},
	files: {
		name: 'Files',
		path: '/user-guide/files/quickstart'
	},
	insights: {
		name: 'Insights',
		path: '/user-guide/insights/quickstart'
	},
}

const product = products[props.product]
</script>

<template>
	<NuxtLink :to="product.path">{{ compact ? product.name : 'Directus ' + product.name }}</NuxtLink>
</template>
