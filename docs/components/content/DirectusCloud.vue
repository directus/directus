<template>
	<a class="directus-cloud" href="https://directus.cloud/register" target="_blank">
		<div>
			<img src="~/assets/img/cloud-logo.svg" alt="directus Cloud">
			<p>Everything you need to start building. Provisioned in 90 seconds.</p>
		</div>
		<Button label="Get Started" type="span" color="white" />
	</a>
</template>

<style scoped>
.directus-cloud {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	background-image: url('~/assets/img/cloud-cta-bg.svg');
	background-size: cover;
	background-position: center bottom;
	border: 1px solid var(--border);
	border-radius: var(--border-radius);
	text-decoration: none;
	color: white;
	padding: 1rem 1.8rem 1rem 1.25rem;
}
div {
	img {
		width: 225px;
		margin-bottom: 0.25rem;
		margin-top: 0.25rem;
	}
	.button {
		margin-bottom: 1rem;
	}
}
p {
	font-size: 1rem;
	margin-bottom: 0;
	font-family: var(--font--header);
	font-weight: 500;
}
.directus-cloud:after {
	display: none !important;
}
</style>
