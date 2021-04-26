<template>
	<value-null v-if="!displayValue" />

	<span v-else class="display-formatted-text" :class="[{ bold }, font]" :style="{ color }">
		{{ displayValue }}
	</span>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import formatTitle from '@directus/format-title';

export default defineComponent({
	props: {
		value: {
			type: [String, Number],
			default: null,
		},
		formatTitle: {
			type: Boolean,
			default: false,
		},
		bold: {
			type: Boolean,
			default: false,
		},
		color: {
			type: String,
			default: null,
		},
		font: {
			type: String,
			default: 'sans-serif',
			validator: (val: string) => ['sans-serif', 'serif', 'monospace'].includes(val),
		},
	},
	setup(props) {
		const displayValue = computed(() => {
			if (!props.value) return null;
			let value = String(props.value);
			value = value.replace(/(<([^>]+)>)/gi, '');

			if (props.formatTitle) {
				value = formatTitle(value);
			}

			return value;
		});

		return { displayValue };
	},
});
</script>

<style lang="scss" scoped>
.display-formatted-text {
	display: inline-block;
	overflow: hidden;
	line-height: 26px;
	white-space: nowrap;
	text-overflow: ellipsis;

	&.bold {
		font-weight: 700;
	}

	&.subdued {
		color: var(--foreground-subdued);
	}

	&.sans-serif {
		font-family: var(--family-sans-serif);
	}

	&.serif {
		font-family: var(--family-serif);
	}

	&.monospace {
		font-family: var(--family-monospace);
	}
}
</style>
