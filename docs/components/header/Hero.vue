<template>
	<div class="hero">
		<div class="container">
			<HeaderHat />
			<div class="main">
				<div class="content">
					<h1>Learn how to get started and implement Directus through our developer resources.</h1>
					<div class="frameworks">
						<NuxtLink to="#">
							<img src="/img/frameworks/next.svg" alt="Next">
						</NuxtLink>
						<NuxtLink to="#">
							<img src="/img/frameworks/nuxt.svg" alt="Nuxt.js">
						</NuxtLink>
						<NuxtLink to="#">
							<img src="/img/frameworks/svelte.svg" alt="Svelte">
						</NuxtLink>
						<NuxtLink to="#">
							<img src="/img/frameworks/astro.svg" alt="Astro">
						</NuxtLink>
						<NuxtLink to="#">
							<img src="/img/frameworks/react.svg" alt="React">
						</NuxtLink>
						<NuxtLink to="#">
							<img src="/img/frameworks/vue.svg" alt="Vue.js">
						</NuxtLink>
						<NuxtLink to="#">
							<img src="/img/frameworks/angular.svg" alt="Angular">
						</NuxtLink>
						<NuxtLink to="#">
							<img src="/img/frameworks/apple.svg" alt="Apple">
						</NuxtLink>
						<NuxtLink to="#">
							<img src="/img/frameworks/remix.svg" alt="Remix">
						</NuxtLink>
					</div>
					<div class="more">
						<Button type="a" label="See all tutorials" href="/tutorials" color="white" size="small" class="all" />
					</div>
				</div>
				<div class="code">Code snippets</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.hero {
	background-image: url('/img/waves.svg');
	background-size: cover;
}
.main {
	display: grid;
	grid-template-columns: 2.5fr 2fr;
	gap: 4rem;
	margin-top: 4rem;
	.content {
		margin-bottom: 4rem;
	}
}
h1 {
	font-weight: 600;
}
.frameworks {
	display: grid;
	grid-template-columns: repeat(9, 1fr);
	gap: 1rem;
	margin-top: 2rem;
	a {
		background: white;
		aspect-ratio: 1/1;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: calc(var(--border-radius) * 3);
		border: 1px solid var(--border-2);
		padding: 0.5rem;
		&:hover {
			background: var(--bg-2);;
		}
	}
	& + .more {
		margin-top: 1rem;
		display: flex;
		justify-content: flex-end;
	}
}
.code {
	background: var(--bg-3);
	border-top-left-radius: 12px;
	border-top-right-radius: 12px;
	border: 1px solid var(--border);
	border-bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
