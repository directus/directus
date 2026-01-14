<script setup lang="ts">
import { type CSSProperties, onBeforeUnmount, onMounted, onUpdated, type Ref, ref } from 'vue';
import { useAutoFontFit } from '@/composables/use-auto-fit-text';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		showHeader?: boolean;
		text?: string;
		whiteSpace?: CSSProperties['white-space'];
		color?: string | undefined;
		textAlign?: CSSProperties['text-align'];
		fontSize?: 'sm' | 'md' | 'lg' | 'auto';
		fontWeight?: number | undefined;
		fontStyle?: string | undefined;
		font?: 'sans-serif' | 'serif' | 'monospace';
	}>(),
	{
		text: '',
		color: undefined,
		whiteSpace: 'normal',
		textAlign: 'center',
		fontSize: 'auto',
		fontWeight: 800,
		fontStyle: undefined,
		font: 'sans-serif',
	},
);

const labelContainer: Ref<HTMLDivElement | null> = ref(null);
const labelText: Ref<HTMLParagraphElement | null> = ref(null);

const { adjustFontSize } = useAutoFontFit(labelContainer, labelText);

let resizeObserver: ResizeObserver | null = null;

function adjustPadding() {
	const container = labelContainer.value;
	if (!container) return '0px';

	const paddingWidth = container.offsetWidth * 0.05;
	const paddingHeight = container.offsetHeight * 0.05;

	const padding = Math.round(Math.max(12, Math.min(paddingWidth, paddingHeight)));

	if (props.showHeader == true) {
		container.style.padding = '0px 12px 12px 12px';
	} else {
		container.style.padding = `${padding}px`;
	}

	return;
}

function unmountResizeObserver() {
	if (resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
	}
}

async function updateFit() {
	if (props.fontSize !== 'auto' || props.text.length <= 0) {
		unmountResizeObserver();
		return;
	}

	await document.fonts.ready;
	adjustPadding();
	adjustFontSize();

	if (!resizeObserver) {
		const container = labelContainer.value;
		if (!container) return;

		// Create a ResizeObserver to watch for changes in the container's dimensions
		resizeObserver = new ResizeObserver(() => {
			updateFit();
		});

		resizeObserver.observe(container);
	}

	adjustFontSize();
}

onMounted(() => {
	updateFit();
});

onUpdated(() => {
	updateFit();
});

onBeforeUnmount(() => {
	unmountResizeObserver();
});
</script>

<template>
	<div
		ref="labelContainer"
		class="label type-title"
		:class="[font, { 'has-header': showHeader }]"
		:style="{ color: color }"
	>
		<p
			ref="labelText"
			class="label-text"
			:style="{ whiteSpace, fontWeight, textAlign, fontStyle, fontSize: fontSize !== 'auto' ? fontSize : undefined }"
		>
			{{ text }}
		</p>
	</div>
</template>

<style lang="scss" scoped>
.label-text {
	min-inline-size: min-content;
	min-block-size: min-content;
	inline-size: 100%;
}

.label {
	display: flex;
	align-items: center;
	inline-size: 100%;
	block-size: 100%;
	color: var(--color-text);
	font-weight: 500;
	line-height: 1.2;

	&.sans-serif {
		font-family: var(--theme--fonts--sans--font-family);
	}

	&.serif {
		font-family: var(--theme--fonts--serif--font-family);
	}

	&.monospace {
		font-family: var(--theme--fonts--monospace--font-family);
	}
}
</style>
