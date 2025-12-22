<script setup lang="ts">
import VButton from '@/components/v-button.vue';

interface Props {
	/** Name of another component to mirror */
	type?:
		| 'input'
		| 'input-tall'
		| 'block-list-item'
		| 'block-list-item-dense'
		| 'list-item-icon'
		| 'text'
		| 'pagination';
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
		<template v-if="type === 'pagination'">
			<VButton v-for="page in 3" :key="page" class="page" small disabled></VButton>
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

	/* stylelint-disable-next-line */
	&::after {
		position: absolute;
		inset-block-start: 0;
		inset-inline: 0;
		z-index: 1;
		block-size: 100%;
		background: linear-gradient(90deg, transparent, var(--theme--background), transparent);
		transform: translateX(-100%);
		opacity: 0.5;
		animation: loading-ltr 1.5s infinite;
		content: '';

		html[dir='rtl'] & {
			transform: translateX(100%);
			animation: loading-rtl 1.5s infinite;
		}
	}

	@keyframes loading-ltr {
		100% {
			transform: translateX(100%);
		}
	}

	@keyframes loading-rtl {
		100% {
			transform: translateX(-100%);
		}
	}
}

.input,
.input-tall {
	inline-size: 100%;
	block-size: var(--theme--form--field--input--height);
	border: var(--theme--border-width) solid
		var(--v-skeleton-loader-background-color, var(--theme--form--field--input--background-subdued));
	border-radius: var(--theme--border-radius);

	@include loader;
}

.input-tall {
	block-size: var(--input-height-tall);
}

.block-list-item {
	inline-size: 100%;
	block-size: var(--theme--form--field--input--height);
	border-radius: var(--theme--border-radius);

	@include loader;

	& + & {
		margin-block-start: 8px;
	}
}

.block-list-item-dense {
	inline-size: 100%;
	block-size: 44px;
	border-radius: var(--theme--border-radius);

	@include loader;

	& + & {
		margin-block-start: 4px;
	}
}

.text {
	flex-grow: 1;
	block-size: 12px;
	border-radius: 6px;

	@include loader;
}

.list-item-icon {
	display: flex;
	align-items: center;
	inline-size: 100%;
	block-size: 46px;

	.icon {
		flex-shrink: 0;
		inline-size: 24px;
		block-size: 24px;
		margin-inline-end: 12px;
		border-radius: 50%;

		@include loader;
	}

	.text {
		flex-grow: 1;
		block-size: 12px;
		border-radius: 6px;

		@include loader;
	}
}

.pagination {
	display: flex;

	.gap {
		display: none;
		margin: 0 4px;
		line-height: 2em;
	}

	@media (min-width: 640px) {
		.gap {
			display: inline;
		}
	}

	.v-button {
		margin: 0 2px;
		@include loader;
		border-radius: var(--theme--border-radius);
		inline-size: 36px;
		block-size: 36px;
	}

	.v-button:first-child {
		margin-inline-start: 0;
	}

	.v-button:last-child {
		margin-inline-end: 0;
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
