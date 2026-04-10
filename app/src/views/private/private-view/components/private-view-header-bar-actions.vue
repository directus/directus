<template>
	<div class="prepend">
		<slot name="prepend" />
	</div>

	<div class="actions">
		<slot />
	</div>

	<div class="primary">
		<slot name="primary" />
	</div>
</template>

<style scoped lang="scss">
.actions {
	position: relative;
	display: flex;
	flex-shrink: 0;
	gap: 0.125rem;
}

.prepend {
	margin-inline-end: 0.625rem;
}

.primary {
	margin-inline-start: 0.625rem;
}

.prepend,
.primary {
	&:empty {
		display: contents;
	}
}
</style>
