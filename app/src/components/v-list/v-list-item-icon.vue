<template>
	<div class="v-list-item-icon" :class="{ center }">
		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		center: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<style>
body {
	--v-list-item-icon-color: var(--foreground-subdued);
}
</style>

<style lang="scss" scoped>
.v-list-item-icon {
	$this: &;

	display: inline-flex;
	align-self: center;
	margin: 8px 0;

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
				--v-icon-color: var(--v-list-item-icon-color);

				margin-top: 4px;
				margin-bottom: 4px;

				&:not(:only-child) {
					&:first-child {
						margin-right: 8px;
					}

					&:last-child {
						margin-left: 8px;
					}
				}
			}

			&.nav #{$this} :slotted(.v-icon) {
				--v-icon-color: none;

				&.dense {
					--v-icon-size: 18px;
				}
			}

			&.disabled #{$this} :slotted(.v-icon) {
				--v-icon-color: var(--foreground-subdued) !important;
			}
		}
	}
}
</style>
