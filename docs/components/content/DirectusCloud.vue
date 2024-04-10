<template>
	<a class="directus-cloud" href="https://directus.cloud/register" target="_blank">
		<img src="~/assets/img/cloud-logo.svg" alt="directus Cloud">
		<p>Everything you need to start building. Provisioned in 90 seconds. Sign up now.</p>
	</a>
</template>

<style scoped>
.directus-cloud {
	display: block;
	background-image: url('~/assets/img/cloud-cta-bg.svg');
	background-size: cover;
	background-position: center bottom;
	border: 1px solid var(--border);
	border-radius: var(--border-radius);
	text-decoration: none;
	color: white;
	padding: 1.25rem 1rem 1rem;
}
img {
	width: 300px;
}
p {
	font-size: 1.25rem;
	margin-bottom: 0;
	font-family: var(--font--header);
	font-weight: 500;
}
</style>
