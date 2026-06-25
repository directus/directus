<template>
	<div class="sub-header">
		<div class="start">
			<slot name="start" />
		</div>
		<div class="end">
			<slot name="end" />
		</div>
	</div>
</template>

<style lang="scss" scoped>
.sub-header {
	position: sticky;
	inset-block-start: 0;
	z-index: 4;
	display: flex;
	align-items: center;
	justify-content: space-between;
	block-size: calc(var(--sub-header-height) + var(--theme--border-width));
	background-color: var(--theme--background);
	border-block-end: var(--theme--border-width) solid var(--theme--border-color);
}
</style>
