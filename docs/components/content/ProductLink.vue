<script setup>
import products from '@/utils/products'

const props = defineProps({
	product: {
		type: String,
		required: true
	},
	compact: {
		type: Boolean,
		default: true
	},
	color: {
		type: String,
		default: 'color',
		validator(value) {
			return ['color', 'white', 'purple', 'pink'].includes(value)
		}
	},
	link: {
		type: Boolean,
		default: true
	}
})

const product = products[props.product]

function componentType() {
	return props.link ? resolveComponent('NuxtLink') : 'span'
}
</script>

<template>
	<component :is="componentType()" :to="product.paths.quickstart"  class="product">
		<img :src="product.icons[color]" alt="">
		<span :class="`${color}`">{{ compact ? product.name : 'Directus ' + product.name }}</span>
	</component>
</template>

<style scoped lang="scss">
.product {
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
		&.color {
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
		&.white {
			color: white;
		}
		&.purple  {
			color: var(--purple--dark-1)
		}
		&.pink  {
			color: var(--pink--dark-1)
		}
	}
}
</style>
