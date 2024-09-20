<template>
	<div id="cl">
		<h2>Directus Cloud</h2>
		<p>Everything you need to start building. Provisioned in 90 seconds. Starting at $15/month.</p>
		<a href="https://directus.cloud">Get Started</a>
	</div>
</template>

<style scoped>
#cl {
	background-color: var(--vp-c-brand-darkest);
	color: white;
	border-radius: var(--rounded-lg);
	padding: 1rem;
}

h2 {
	font-size: 1.125rem;
	text-wrap: balance;
	font-weight: bold;
}

p {
	font-size: 0.75rem;
	line-height: 1.125rem;
	margin: 0.75rem 0;
	font-weight: 500;
}

a {
	font-size: 0.8rem;
	text-align: center;
	background-color: var(--vp-c-brand);
	font-weight: 600;
	color: white;
	border-radius: var(--rounded-full);
	border: none;
	display: block;
	width: 100%;
	padding: 0.5em;
	margin-top: 1rem;
	cursor: pointer;
}

a:hover {
	background-color: var(--vp-c-brand-light);
}
</style>
