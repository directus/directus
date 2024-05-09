<template>
	<header class="container">
		<NuxtLink to="/">
			<HeaderLogo />
		</NuxtLink>
		<div class="search">
			<div class="search-box">Search</div>
		</div>
		<div class="links">
			<a href="https://x.com/directus">
				<Icon name="ri:twitter-x-fill" />
			</a>
			<a href="https://github.com/directus/directus">
				<Icon name="ri:github-fill" />
			</a>
			<a href="https://directus.chat">
				<Icon name="ri:discord-fill" />
			</a>
			<Button type="a" label="Register" href="https://directus.cloud/register" target="_blank" color="white" size="small" class="register" />
			<Button type="a" label="Sign In" href="https://directus.cloud" target="_blank" color="primary" size="small" />
		</div>
	</header>
</template>

<style scoped lang="scss">
header {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 2rem;
	padding-top: 1rem;
	padding-bottom: 1rem;
}

.search {
	display: flex;
	justify-content: center;
	align-items: center;
	.search-box {
		background: white;
		border: 1px solid var(--border-2);
		border-radius: var(--border-radius);
		width: 250px;
		padding: 6px 9px;
		font-size: 0.8rem;
		color: var(--border-3);
	}
}

.links {
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
	align-items: center;
	.icon {
		color: var(--typography--subdued);
		margin-bottom: 1px;
		&:hover {
			color: var(--typography);
		}
	}
	.register {
		margin-right: -0.5rem;
	}
}
</style>
