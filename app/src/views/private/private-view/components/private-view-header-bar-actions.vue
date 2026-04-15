<template>
	<div class="actions">
		<div class="prepend">
			<slot name="prepend" />
		</div>

		<div class="default">
			<slot />
		</div>

		<div class="primary">
			<slot name="primary" />
		</div>
	</div>
</template>

<style scoped lang="scss">
.actions {
	position: relative;
	display: flex;
	align-items: center;
	gap: 0.625rem;
}

.default {
	position: relative;
	display: flex;
	align-items: center;
	gap: 0.125rem;
}

.primary {
	display: flex;
	align-items: center;
	gap: 0.625rem;
}

.prepend,
.default,
.primary {
	&:empty {
		display: contents;
	}
}
</style>
