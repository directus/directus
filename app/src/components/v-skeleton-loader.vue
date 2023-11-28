<script setup lang="ts">
interface Props {
	/** Name of another component to mirror */
	type?: 'input' | 'input-tall' | 'block-list-item' | 'block-list-item-dense' | 'list-item-icon' | 'text';
}

withDefaults(defineProps<Props>(), {
	type: 'input',
});
</script>

<template>
	<div :class="type" class="v-skeleton-loader">
		<template v-if="type === 'list-item-icon'">
			<div class="icon" />
			<div class="text" />
		</template>
	</div>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-skeleton-loader-background-color  [var(--theme--form--field--input--background-subdued)]

*/

.v-skeleton-loader {
	position: relative;
	overflow: hidden;
	cursor: progress;
}

@mixin loader {
	position: relative;
	overflow: hidden;
	background-color: var(--v-skeleton-loader-background-color, var(--theme--form--field--input--background-subdued));

	&::after {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		z-index: 1;
		height: 100%;
		background: linear-gradient(90deg, transparent, var(--theme--background), transparent);
		transform: translateX(-100%);
		opacity: 0.5;
		animation: loading 1.5s infinite;
		content: '';
	}

	@keyframes loading {
		100% {
			transform: translateX(100%);
		}
	}
}

.input,
.input-tall {
	width: 100%;
	height: var(--theme--form--field--input--height);
	border: var(--theme--border-width) solid
		var(--v-skeleton-loader-background-color, var(--theme--form--field--input--background-subdued));
	border-radius: var(--theme--border-radius);

	@include loader;
}

.input-tall {
	height: var(--input-height-tall);
}

.block-list-item {
	width: 100%;
	height: var(--theme--form--field--input--height);
	border-radius: var(--theme--border-radius);

	@include loader;

	& + & {
		margin-top: 8px;
	}
}

.block-list-item-dense {
	width: 100%;
	height: 44px;
	border-radius: var(--theme--border-radius);

	@include loader;

	& + & {
		margin-top: 4px;
	}
}

.text {
	flex-grow: 1;
	height: 12px;
	border-radius: 6px;

	@include loader;
}

.list-item-icon {
	display: flex;
	align-items: center;
	width: 100%;
	height: 46px;

	.icon {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		margin-right: 12px;
		border-radius: 50%;

		@include loader;
	}

	.text {
		flex-grow: 1;
		height: 12px;
		border-radius: 6px;

		@include loader;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter-from,
.fade-leave-to {
	position: absolute;
	opacity: 0;
}
</style>
