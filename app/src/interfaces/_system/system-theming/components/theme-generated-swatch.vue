<template>
	<div
		v-tooltip.bottom="
			`${isCopySupported ? t('copy') + ' ' : ''}${sourceName} ${fieldData.name}: ${modelValue.toUpperCase()}`
		"
		class="theme-generated-color"
	>
		<div
			class="theme-generated-color-display"
			:style="{
				'background-color': modelValue || '#cccccc',
				//@ts-ignore
				'--red': inputAsRGB(modelValue).r,
				'--green': inputAsRGB(modelValue).g,
				'--blue': inputAsRGB(modelValue).b,
			}"
		>
			<div v-if="isCopySupported" class="copy-color" @click="copyHex(modelValue)">
				<v-icon name="content_copy" />
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { Field } from '@directus/shared/types';
import useClipboard from '@/composables/use-clipboard';
import Color from 'color';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

interface Props {
	modelValue: string;
	fieldData: Field;
	sourceName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(defineProps<Props>(), {
	sourceName: '',
});

const { copyToClipboard, isCopySupported } = useClipboard();

async function copyHex(value: string) {
	await copyToClipboard(value);
}

function inputAsRGB(color: string) {
	return Color(color).rgb().object();
}
</script>

<style lang="scss" scoped>
.theme-generated-color {
	border: var(--g-border-width) solid var(--g-color-border-normal);
	border-radius: var(--g-border-radius);
	overflow: hidden;
	width: 48px;
	height: 48px;
	display: block;
	margin: 0;
	transition: border-color var(--fast) var(--transition);
	cursor: pointer;
	.theme-generated-color-display {
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr);
		min-height: 100%;
		min-width: 100%;
		display: grid;
		border: var(--g-border-width) solid var(--background-input);
		border-radius: calc(var(--g-border-radius) - 2px);
		align-content: center;
		justify-content: center;
		--r: calc(var(--red) * 0.299);
		--g: calc(var(--green) * 0.587);
		--b: calc(var(--blue) * 0.114);
		--sum: calc(var(--r) + var(--g) + var(--b));
		--perceived-lightness: calc(var(--sum) / 255);
		--threshold: 0.6;
		--offset: calc(var(--perceived-lightness) - var(--threshold));
		--extreme: calc(var(--offset) * -1000000000);
		--bool: clamp(0, var(--extreme), 1);
		.copy-color {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: minmax(0, 1fr);
			align-items: center;
			justify-items: center;
			display: grid;
			color: hsl(0, 0%, calc(100% * var(--bool)));
			opacity: 0;
			transition: opacity var(--fast) var(--transition);
		}
	}
	&:hover {
		border-color: var(--g-color-border-accent);
		transition: border-color var(--fast) var(--transition);
		.theme-generated-color-display {
			.copy-color {
				display: grid;
				opacity: 1;
				transition: opacity var(--fast) var(--transition);
			}
		}
	}
}
</style>
