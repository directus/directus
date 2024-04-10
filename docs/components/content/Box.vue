<template>
	<div class="box">
		<slot />
	</div>
</template>

<style scoped>
div {
	border: 1px solid lightgrey;
	border-radius: var(--border-radius);
	padding: 1rem;
}
div:deep(> *:last-child) {
	margin-bottom: 0;
}
</style>
