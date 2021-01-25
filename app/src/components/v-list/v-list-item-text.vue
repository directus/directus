<template functional>
	<div class="v-list-item-text">
		<slot />
	</div>
</template>

<style lang="scss" scoped>
.v-list-item-text {
	flex-basis: 100%;
	flex-grow: 1;
	flex-shrink: 1;
	align-self: center;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
