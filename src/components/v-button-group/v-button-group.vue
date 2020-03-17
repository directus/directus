<template>
	<div class="v-button-group" :class="{ rounded, tile }">
		<v-item-group
			:value="value"
			@input="update"
			:mandatory="mandatory"
			:max="max"
			:multiple="multiple"
		>
			<slot />
		</v-item-group>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';

export default defineComponent({
	props: {
		mandatory: {
			type: Boolean,
			default: false
		},
		max: {
			type: Number,
			default: -1
		},
		multiple: {
			type: Boolean,
			default: false
		},
		value: {
			type: Array as PropType<(string | number)[]>,
			default: undefined
		},
		rounded: {
			type: Boolean,
			default: false
		},
		tile: {
			type: Boolean,
			default: false
		}
	},
	setup(props, { emit }) {
		function update(newSelection: readonly (string | number)[]) {
			emit('input', newSelection);
		}

		return { update };
	}
});
</script>
<style lang="scss" scoped>
.v-button-group {
	--v-button-group-background-color-active: var(--button-primary-background-color-disabled);

	.v-item-group {
		::v-deep .v-button {
			--button-border-radius: 0px;

			&:active {
				transform: unset;
			}

			&.active {
				--v-button-background-color: var(--v-button-group-background-color-active);
				--v-button-background-color-hover: var(--v-button-group-background-color-active);
			}

			&:first-child {
				--button-border-radius: var(--input-border-radius) 0px 0px
					var(--input-border-radius);
			}

			&:last-child {
				--button-border-radius: 0px var(--input-border-radius) var(--input-border-radius)
					0px;
			}
		}
	}

	&.tile .v-item-group ::v-deep .v-button {
		&:first-child {
			--button-border-radius: 0px;
		}

		&:last-child {
			--button-border-radius: 0px;
		}
	}

	&.rounded:not(.tile) .v-item-group ::v-deep .v-button {
		&:first-child {
			--button-border-radius: var(--v-button-height) 0px 0px var(--v-button-height);
		}

		&:last-child {
			--button-border-radius: 0px var(--v-button-height) var(--v-button-height) 0px;
		}
	}
}
</style>
