<script setup lang="ts">
interface Props {
	center?: boolean;
}

withDefaults(defineProps<Props>(), {
	center: false,
});
</script>

<template>
	<div class="v-list-item-icon" :class="{ center }">
		<slot />
	</div>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-list-item-icon-color  [var(--theme--foreground-subdued)]

*/

.v-list-item-icon {
	$this: &;

	display: inline-flex;
	align-self: center;
	margin: 8px 0;

	&:not(:only-child) {
		&:first-child {
			margin-inline-end: 12px;
		}

		&:last-child {
			margin-inline-start: 12px;
		}
	}

	@at-root {
		.v-list,
		.v-list-item {
			#{$this} {
				--v-icon-color: var(--v-list-item-icon-color, var(--theme--foreground-subdued));

				margin-block: 4px;

				&:not(:only-child) {
					&:first-child {
						margin-inline-end: 8px;
					}

					&:last-child {
						margin-inline-start: 8px;
					}
				}
			}

			&.nav #{$this} :slotted(.v-icon) {
				&.dense {
					--v-icon-size: 18px;
				}
			}

			&.disabled #{$this} :slotted(.v-icon) {
				--v-icon-color: var(--theme--foreground-subdued) !important;
			}
		}
	}
}
</style>
