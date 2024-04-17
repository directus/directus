<template>
	<a class="directus-cloud" href="https://directus.cloud/register" target="_blank">
		<div>
			<img src="~/assets/img/cloud-logo.svg" alt="directus Cloud">
			<Button label="Get Started" type="span" color="white" />
		</div>
		<p>Everything you need to start building. Provisioned in 90 seconds.</p>
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
	padding: 1rem;
}
img {
	width: 225px;
}
div {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 1rem;
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
