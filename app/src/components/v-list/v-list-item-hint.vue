<template>
	<div class="v-list-item-hint" :class="{ center }">
		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		center: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<style lang="scss" scoped>
.v-list-item-hint {
	$this: &;

	display: inline-flex;
	align-self: center;
	margin: 8px 0;
	color: var(--foreground-subdued);

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
			&.large {
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
