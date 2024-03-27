<template>
	<section class="hero">
		<h1>Directus Developer Blog</h1>
		<p>Project tutorials, tips & tricks, and best practices from the Directus team and community.</p>
		<Button href="/blog/guest-author" primary>Become a Guest Author</Button>
	</section>
</template>

<style scoped>
.hero {
	padding: 32px 64px;
}
.hero h1 {
	font-size: 60px;
	font-weight: 700;
	line-height: 1;
	margin: 20px 0;
}
.hero p {
	max-inline-size: 50ch;
	margin: 20px 0;
}

@media screen and (max-width: 1200px) {
	.hero {
		padding-left: 32px;
		padding-right: 32px;
	}
	.hero h1 {
		font-size: 42px;
	}
}
</style>
