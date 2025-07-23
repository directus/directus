<script setup lang="ts">
interface Props {
	center?: boolean;
}

withDefaults(defineProps<Props>(), {
	center: false,
});
</script>

<template>
	<div class="v-list-item-hint" :class="{ center }">
		<slot />
	</div>
</template>

<style lang="scss" scoped>
.v-list-item-hint {
	$this: &;

	display: inline-flex;
	align-self: center;
	margin: 8px 0;
	color: var(--theme--foreground-subdued);

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
				margin-block: 4px;

				&:not(:only-child) {
					&:first-child {
						margin-inline-end: 16px;
					}

					&:last-child {
						margin-inline-start: 16px;
					}
				}
			}

			&.nav {
				&.three-line,
				&.two-line {
					#{$this} {
						align-self: flex-start;

						&.center {
							align-self: center;
						}
					}
				}
			}
		}
	}
}
</style>
