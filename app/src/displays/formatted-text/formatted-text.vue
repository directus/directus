<template>
	<span
		class="display-formatted-text"
		:class="[
			{
				bold,
				subdued,
			},
			font,
		]"
	>
		{{ displayValue }}
	</span>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		interfaceOptions: {
			type: Object,
			default: null,
		},
		bold: {
			type: Boolean,
			default: false,
		},
		subdued: {
			type: Boolean,
			default: false,
		},
		font: {
			type: String,
			default: 'sans-serif',
			validator: (val: string) => ['sans-serif', 'serif', 'monospace'].includes(val),
		},
	},
	setup(props) {
		const displayValue = computed(() => props.value.replace(/(<([^>]+)>)/gi, ''));

		return { displayValue };
	},
});
</script>

<style lang="scss" scoped>
.display-formatted-text {
	display: inline-block;
	overflow: hidden;
	line-height: 22px;
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
