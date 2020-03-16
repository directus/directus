<template>
	<div class="v-list-item-icon" :class="{ center }">
		<slot></slot>
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		center: {
			type: Boolean,
			default: false
		}
	}
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/type-styles';

.v-list-item-icon {
	$this: &;

	display: inline-flex;
	align-self: center;
	margin: 12px 0;

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
			&.three-line,
			&.two-line {
				#{$this} {
					align-self: flex-start;
					&.center {
						align-self: center;
					}
				}
			}
			&.dense {
				#{$this} {
					margin-top: 8px;
					margin-bottom: 8px;
					&:not(:only-child) {
						&:first-child {
							margin-right: 8px;
						}
						&:last-child {
							margin-left: 8px;
						}
					}
				}
			}
		}
	}
}
</style>
