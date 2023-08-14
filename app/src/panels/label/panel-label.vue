<template>
	<div
		ref="labelContainer"
		class="label type-title selectable"
		:class="[font, { 'has-header': showHeader }]"
		:style="{ color: color }"
	>
		<p ref="labelText" :style="{ whiteSpace: whiteSpace, fontWeight: fontWeight, textAlign: textAlign, fontStyle: fontStyle }">
			{{ text }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, onUpdated, ref } from 'vue';

withDefaults(
	defineProps<{
		showHeader?: boolean;
		text?: string;
		whiteSpace?: string | undefined;
		color?: string | undefined;
		textAlign?: string | undefined;
		fontWeight?: number | undefined;
		fontStyle?: string | undefined;
		font?: 'sans-serif' | 'serif' | 'monospace';
	}>(),
	{
		showHeader: false,
		text: '',
		color: undefined,
		whiteSpace: 'normal',
		textAlign: 'center',
		fontWeight: 400,
		fontStyle: undefined,
		font: 'sans-serif',
	}
);

const labelContainer = ref<HTMLDivElement | null>(null);
const labelText = ref<HTMLParagraphElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
	const container = labelContainer.value;

	if (container) {
		adjustFontSize(container);

		// Create a ResizeObserver to watch for changes in the container's dimensions
		resizeObserver = new ResizeObserver(() => {
			adjustFontSize(container);
		});

		resizeObserver.observe(container);
	}
});

onUpdated(() => {
	const container = labelContainer.value;

	if (container) {
		adjustFontSize(container);
	}
});

onBeforeUnmount(() => {
	// Disconnect the ResizeObserver when the component is unmounted
	if (resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
	}
});

function adjustFontSize(container: HTMLDivElement) {
	const text = labelText.value;
	if (!container || !text) return;
	let fontSize = 128; // starting font size in px
	let padding = Math.max(5, fontSize * 0.3);

	container.style.fontSize = `${fontSize}px`;

	// Decrease the font size until the text fits the container
	while (
		text &&
		(text.offsetHeight > container.offsetHeight - padding * 2 || text.offsetWidth > container.offsetWidth - padding * 2)
	) {
		fontSize -= 1;
		padding = Math.max(5, fontSize * 0.3)
		container.style.fontSize = `${fontSize}px`;
		container.style.padding = `${padding}px`;
	}
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	inheritAttrs: false,
});
</script>

<style lang="scss" scoped>
.label {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	color: var(--color-text);
	font-weight: 500;
	line-height: 1.2;

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

.label.has-header {
	height: calc(100% - 24px);
}
</style>
