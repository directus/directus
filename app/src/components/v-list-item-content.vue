<template>
	<div class="v-list-item-content">
		<slot />
	</div>
</template>

<style scoped>
/*

	Available Variables:

		--v-list-item-content-padding      [9px 0]
		--v-list-item-content-font-family  [inherit]

*/

.v-list-item-content {
	display: flex;
	flex: 1 1 0;
	flex-wrap: wrap;
	align-items: center;
	align-self: center;
	padding: var(--v-list-item-content-padding, 9px 0);
	overflow: hidden;
	font-family: var(--v-list-item-content-font-family, inherit);
}

.v-list.three-line .v-list-item-content,
.v-list-item.three-line .v-list-item-content {
	align-self: stretch;
}

.v-list-item-content > :deep(*) {
	flex: 1 0 100%;
	line-height: 1.4;
}

.v-list-item-content > :slotted(*:not(:last-child)) {
	margin-block-end: 2px;
}

.v-list:not(.nav) .v-list-item-content,
.v-list-item:not(.nav) .v-list-item-content {
	--v-list-item-content-padding: 4px 0;
}
</style>
