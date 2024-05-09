<script setup>
import products from '@/utils/products'

const boxes = [
	{
		title: 'Data Engine',
		description: 'APIs and developer tools for your data.',
		color: 'purple',
		products: ['connect', 'realtime', 'auth', 'automate']
	},
	{
		title: 'Data Studio',
		description: 'A data web app your whole team will love.',
		color: 'pink',
		products: ['explore', 'editor', 'insights', 'files']
	},
]
</script>

<template>
	<div v-for="box in boxes" :key="box.title" class="box" :style="`--box-color: var(--${box.color});`">
		<h2>{{box.title}}</h2>
		<p>{{box.description}}</p>
		<div class="products">
			<div v-for="product in box.products" :key="product" class="prod">
				<ProductLink :product="product" :link="false" :color="box.color" />
				<div class="links">
					<NuxtLink :to="products[product].paths.overview">Overview</NuxtLink>
					<NuxtLink :to="products[product].paths.quickstart">Quickstart</NuxtLink>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.box {
	border: 3px solid var(--box-color);
	border-radius: calc(var(--border-radius) * 2);
	padding: 1rem;
	background: var(--bg-2);
	h2 {
		font-weight: normal;
		font-size: 2rem;
		margin: 4px 0 0;
		line-height: 1;
	}
	p {
		margin: 0.5rem 0;
	}
	.products {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}
	.prod {
		// background: var(--box-color);
		border-radius: var(--border-radius);
		img {
			position: relative;
			display: inline;
			height: 1rem;
			width: auto;
			border-radius: 0;
			margin-bottom: 0;
			top: 2px;
		}
		.links {
			display: flex;
			gap: 1rem;
		}
		a {
			// color: white;
			font-size: 0.8rem;
		}
	}
}
</style>
