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
			margin-right: 12px;
		}

		&:last-child {
			margin-left: 12px;
		}
	}

	@at-root {
		.v-list,
		.v-list-item {
			#{$this} {
				margin-top: 4px;
				margin-bottom: 4px;

				&:not(:only-child) {
					&:first-child {
						margin-right: 16px;
					}

					&:last-child {
						margin-left: 16px;
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
