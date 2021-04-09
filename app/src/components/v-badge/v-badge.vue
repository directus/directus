<template>
	<div class="v-badge" :class="{ dot, bordered }">
		<span v-if="!disabled" class="badge" :class="{ dot, bordered, left, bottom }">
			<v-icon v-if="icon" :name="icon" :color="color" x-small />
			<span v-else>{{ value }}</span>
		</span>

		<slot></slot>
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: [Boolean, String, Number],
			default: null,
		},
		dot: {
			type: Boolean,
			default: false,
		},
		left: {
			type: Boolean,
			default: false,
		},
		bottom: {
			type: Boolean,
			default: false,
		},
		icon: {
			type: String,
			default: null,
		},
		bordered: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<style>
body {
	--v-badge-color: var(--white);
	--v-badge-background-color: var(--danger);
	--v-badge-border-color: var(--background-page);
	--v-badge-offset-x: 0px;
	--v-badge-offset-y: 0px;
	--v-badge-size: 16px;
}
</style>

<style lang="scss" scoped>
.v-badge {
	position: relative;
	display: inline-block;

	&.bordered {
		--v-badge-size: 20px;
	}

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
		font-weight: 600;
		font-size: 11px;
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
