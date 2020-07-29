<template>
	<div class="v-list-item-content">
		<slot></slot>
	</div>
</template>

<style>
body {
	--v-list-item-content-padding: 9px 0;
}
</style>

<style lang="scss" scoped>
.v-list-item-content {
	display: flex;
	flex-basis: 0;
	flex-grow: 1;
	flex-shrink: 1;
	flex-wrap: wrap;
	align-items: center;
	align-self: center;
	padding: var(--v-list-item-content-padding);
	overflow: hidden;

	.v-list.three-line &,
	.v-list-item.three-line & {
		align-self: stretch;
	}

	::v-deep {
		& > * {
			flex-basis: 100%;
			flex-grow: 1;
			flex-shrink: 0;
			line-height: 1.4;

			&:not(:last-child) {
				margin-bottom: 2px;
			}
		}
	}

	.v-list.dense &,
	.v-list-item.dense & {
		--v-list-item-content-padding: 4px 0;
	}
}
</style>
