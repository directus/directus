<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';

withDefaults(
	defineProps<{
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
	}>(),
	{
		value: null,
		icon: null,
	},
);
</script>

<template>
	<div class="v-badge" :class="{ dot, bordered }">
		<span v-if="!disabled" class="badge" :class="{ dot, bordered, left, bottom }">
			<VIcon v-if="icon" :name="icon" x-small />
			<span v-else>{{ value }}</span>
		</span>

		<slot />
	</div>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

			--v-badge-color             [var(--white)]
			--v-badge-background-color  [var(--red)]
			--v-badge-border-color      [var(--theme--background)]
			--v-badge-offset-x          [0rem]
			--v-badge-offset-y          [0rem]
			--v-badge-size              [0.875rem]

*/

.v-badge {
	position: relative;
	display: inline-block;

	&.dot {
		--v-badge-size: 0.4375rem;

		&.bordered {
			--v-badge-size: 0.6875rem;
		}
	}

	.badge {
		position: absolute;
		inset-block-start: calc(var(--v-badge-size, 0.875rem) / -2 + var(--v-badge-offset-y, 0rem));
		inset-inline-end: calc(var(--v-badge-size, 0.875rem) / -2 + var(--v-badge-offset-x, 0rem));
		z-index: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		inline-size: max-content;
		min-inline-size: var(--v-badge-size, 0.875rem);
		block-size: var(--v-badge-size, 0.875rem);
		padding: 0 0.3125rem;
		color: var(--v-badge-color, var(--white));
		font-weight: 800;
		font-size: 0.5rem;
		background-color: var(--v-badge-background-color, var(--red));
		border-radius: calc(var(--v-badge-size, 0.875rem) / 2);

		&.left {
			inset-inline-end: unset;
			inset-inline-start: calc(var(--v-badge-size, 0.875rem) / -2 + var(--v-badge-offset-x, 0rem));
		}

		&.bottom {
			inset-block-start: unset;
			inset-block-end: calc(var(--v-badge-size, 0.875rem) / -2 + var(--v-badge-offset-y, 0rem));
		}

		&.bordered {
			filter: drop-shadow(1.5px 1.5px 0 var(--v-badge-border-color, var(--theme--background)))
				drop-shadow(1.5px -1.5px 0 var(--v-badge-border-color, var(--theme--background)))
				drop-shadow(-1.5px 1.5px 0 var(--v-badge-border-color, var(--theme--background)))
				drop-shadow(-1.5px -1.5px 0 var(--v-badge-border-color, var(--theme--background)));
		}

		&.dot {
			inline-size: var(--v-badge-size, 0.875rem);
			min-inline-size: 0;
			block-size: var(--v-badge-size, 0.875rem);
			border: 0;

			* {
				display: none;
			}
		}
	}
}
</style>
