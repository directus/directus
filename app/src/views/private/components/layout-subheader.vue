<template>
	<div class="layout-subheader">
		<div class="start">
			<slot name="start" />
		</div>
		<div class="end">
			<slot name="end" />
		</div>
	</div>
</template>

<style lang="scss" scoped>
.layout-subheader {
	position: sticky;
	inset-block-start: var(--layout-offset-top);
	z-index: 4;
	display: flex;
	align-items: center;
	justify-content: space-between;
	inline-size: calc(100% + 2 * var(--content-padding));
	block-size: 2.9375rem;
	margin-inline: calc(-1 * var(--content-padding));
	margin-block-end: var(--content-padding);
	padding: 0.625rem 1.5rem;
	background-color: var(--theme--background);
	border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
	box-shadow: 0 0 0 2px var(--theme--background);
}
</style>
