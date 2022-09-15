<template>
	<div class="v-badge" :class="{ dot, bordered }">
		<span v-if="!disabled" class="badge" :class="{ dot, bordered, left, bottom }">
			<v-icon v-if="icon" :name="icon" x-small />
			<span v-else>{{ value }}</span>
		</span>

		<slot />
	</div>
</template>

<script setup lang="ts">
interface Props {
	/** The value that will be displayed inside the badge Only 2 characters allowed) */
	value?: string | number | boolean | null;
	/** Only will show a small dot without any content */
	dot?: boolean;
	/** Aligns the badge on the left side */
	left?: boolean;
	/** Aligns the badge on the bottom side */
	bottom?: boolean;
	/** Shows an icon instead of text */
	icon?: string | null;
	/** Shows a border around the badge */
	bordered?: boolean;
	/** Hide the badge */
	disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
	value: null,
	dot: false,
	left: false,
	bottom: false,
	icon: null,
	bordered: false,
	disabled: false,
});
</script>

<style lang="scss" scoped>
:global(body) {
	--v-badge-color: var(--white);
	--v-badge-background-color: var(--red);
	--v-badge-border-color: var(--background-page);
	--v-badge-offset-x: 0px;
	--v-badge-offset-y: 0px;
	--v-badge-size: 16px;
}

.v-badge {
	position: relative;
	display: inline-block;

	&.dot {
		--v-badge-size: 8px;

		&.bordered {
			--v-badge-size: 12px;
		}
	}

	.badge {
		position: absolute;
		top: calc(var(--v-badge-size) / -2 + var(--v-badge-offset-y));
		right: calc(var(--v-badge-size) / -2 + var(--v-badge-offset-x));
		z-index: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: max-content;
		min-width: var(--v-badge-size);
		height: var(--v-badge-size);
		padding: 0 5px;
		color: var(--v-badge-color);
		font-weight: 800;
		font-size: 9px;
		background-color: var(--v-badge-background-color);
		border-radius: calc(var(--v-badge-size) / 2);

		&.left {
			right: unset;
			left: calc(var(--v-badge-size) / -2 + var(--v-badge-offset-x));
		}

		&.bottom {
			top: unset;
			bottom: calc(var(--v-badge-size) / -2 + var(--v-badge-offset-y));
		}

		&.bordered {
			filter: drop-shadow(1.5px 1.5px 0 var(--v-badge-border-color))
				drop-shadow(1.5px -1.5px 0 var(--v-badge-border-color)) drop-shadow(-1.5px 1.5px 0 var(--v-badge-border-color))
				drop-shadow(-1.5px -1.5px 0 var(--v-badge-border-color));
		}

		&.dot {
			width: var(--v-badge-size);
			min-width: 0;
			height: var(--v-badge-size);
			border: 0;

			* {
				display: none;
			}
		}
	}
}
</style>
