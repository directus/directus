<template>
	<v-menu attached :disabled="disabled" :close-on-content-click="false">
		<template #activator="{ activate }">
			<v-input
				v-model="hex"
				:disabled="disabled"
				:placeholder="placeholder || t('interfaces.select-color.placeholder')"
				:pattern="opacity ? /#([a-f\d]{2}){4}/i : /#([a-f\d]{2}){3}/i"
				class="color-input"
				:maxlength="opacity ? 9 : 7"
				@focus="activate"
			>
				<template #prepend>
					<v-input
						ref="htmlColorInput"
						:model-value="hex ? hex.slice(0, 7) : null"
						type="color"
						class="html-color-select"
						@update:model-value="setSwatchValue($event)"
					/>
					<v-button
						class="swatch"
						:icon="true"
						:style="{
							'--v-button-background-color': isValidColor ? hex : 'transparent',
							border: lowContrast === false ? 'none' : 'var(--border-width) solid var(--border-normal)',
						}"
						@click="activateColorPicker"
					>
						<v-icon v-if="!isValidColor" name="colorize" />
					</v-button>
				</template>
				<template #append>
					<v-icon :name="isValidColor ? 'close' : 'palette'" :clickable="isValidColor" @click="unsetColor" />
				</template>
			</v-input>
		</template>

		<div
			class="color-data-inputs"
			:style="{
				'grid-template-columns': opacity
					? width.startsWith('half')
						? 'repeat(4, 1fr)'
						: 'repeat(6, 1fr)'
					: width.startsWith('half')
					? 'repeat(3, 1fr)'
					: 'repeat(5, 1fr)',
			}"
			:class="{ stacked: width.startsWith('half') }"
		>
			<div
				class="color-data-input color-type"
				:style="{
					'grid-column': opacity
						? width.startsWith('half')
							? '1 / span 4'
							: '1 / span 2'
						: width.startsWith('half')
						? '1 / span 3'
						: '1 / span 2',
				}"
			>
				<v-select v-model="colorType" :items="colorTypes" />
			</div>
			<template v-if="colorType === 'RGB' || colorType === 'RGBA'">
				<v-input
					v-for="(val, i) in rgb.length > 3 ? rgb.slice(0, -1) : rgb"
					:key="i"
					:hidden="i === 3"
					type="number"
					:model-value="val"
					class="color-data-input"
					pattern="\d*"
					:min="0"
					:max="255"
					:step="1"
					maxlength="3"
					@update:model-value="setValue('rgb', i, $event)"
				/>
				<v-input
					v-if="opacity"
					type="number"
					:model-value="alpha"
					class="color-data-input"
					pattern="\d*"
					:min="0"
					:max="100"
					:step="1"
					maxlength="3"
					@update:model-value="setValue('alpha', 0, $event)"
				/>
			</template>
			<template v-if="colorType === 'HSL' || colorType === 'HSLA'">
				<v-input
					v-for="(val, i) in hsl.length > 3 ? hsl.slice(0, -1) : hsl"
					:key="i"
					type="number"
					:model-value="val"
					class="color-data-input"
					pattern="\d*"
					:min="0"
					:max="i === 0 ? 360 : 100"
					:step="1"
					maxlength="3"
					@update:model-value="setValue('hsl', i, $event)"
				/>
				<v-input
					v-if="opacity"
					type="number"
					:model-value="alpha"
					class="color-data-input"
					pattern="\d*"
					:min="0"
					:max="100"
					:step="1"
					maxlength="3"
					@update:model-value="setValue('alpha', 0, $event)"
				/>
			</template>
		</div>
		<div v-if="opacity" class="color-data-alphas">
			<div class="color-data-alpha">
				<v-slider
					:model-value="alpha"
					:min="0"
					:max="100"
					:step="1"
					:style="{
						'--v-slider-color': 'none',
						'--background-page': 'none',
						'--v-slider-fill-color': 'none',
						'--v-slider-thumb-color': 'var(--foreground-normal)',
						'--v-slider-track-background-image':
							'linear-gradient(to right, transparent,' +
							(hex && hex.length === 9 ? hex.slice(0, -2) : hex ? hex : 'transparent') +
							'), url(\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==\')',
					}"
					@update:model-value="setValue('alpha', 0, $event)"
				/>
			</div>
		</div>
		<div v-if="presets" class="presets">
			<v-button
				v-for="preset in presets"
				:key="preset.color"
				v-tooltip="preset.name"
				class="preset"
				rounded
				icon
				:class="{ 'low-contrast': getPresetContrast(preset.color) }"
				:style="{ '--v-button-background-color': preset.color }"
				@click="() => (hex = preset.color)"
			/>
		</div>
	</v-menu>
</template>

<script setup lang="ts">
import Color from 'color';
import { isHex } from '@/utils/is-hex';
import { cssVar } from '@directus/utils/browser';
import { ComponentPublicInstance, computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { i18n } from '@/lang';

const { t } = useI18n();

interface Props {
	disabled?: boolean;
	value?: string | null;
	placeholder?: string;
	presets?: { name: string; color: string }[];
	width: string;
	opacity?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
	value: () => null,
	placeholder: undefined,
	opacity: false,
	presets: () => [
		{
			name: i18n.global.t('colors.purple'),
			color: '#6644FF',
		},
		{
			name: i18n.global.t('colors.blue'),
			color: '#3399FF',
		},
		{
			name: i18n.global.t('colors.green'),
			color: '#2ECDA7',
		},
		{
			name: i18n.global.t('colors.yellow'),
			color: '#FFC23B',
		},
		{
			name: i18n.global.t('colors.orange'),
			color: '#FFA439',
		},
		{
			name: i18n.global.t('colors.red'),
			color: '#E35169',
		},
		{
			name: i18n.global.t('colors.black'),
			color: '#18222F',
		},
		{
			name: i18n.global.t('colors.gray'),
			color: '#A2B5CD',
		},
		{
			name: i18n.global.t('colors.white'),
			color: '#FFFFFF',
		},
	],
});

const emit = defineEmits(['input']);

const valueWithoutVariables = computed(() => {
	if (!props.value) return null;
	return props.value?.startsWith('var(--') ? cssVar(props.value.substring(4, props.value.length - 1)) : props.value;
});

const htmlColorInput = ref<ComponentPublicInstance | null>(null);
type ColorType = 'RGB' | 'HSL' | 'RGBA' | 'HSLA';

let colorTypes = props.opacity ? ref<ColorType[]>(['RGBA', 'HSLA']) : ref<ColorType[]>(['RGB', 'HSL']);
const colorType = ref<ColorType>(props.opacity ? 'RGBA' : 'RGB');

const isValidColor = computed<boolean>(() => rgb.value !== null && valueWithoutVariables.value !== null);

const lowContrast = computed(() => {
	if (color.value === null) return true;

	const pageColorString = cssVar('--background-page');
	const pageColor = Color(pageColorString);

	return color.value.contrast(pageColor) < 1.1;
});

const getPresetContrast = (hex: string) => {
	if (hex.startsWith('--')) hex = cssVar(hex);
	const color = Color(hex);
	return color.contrast(Color(cssVar('--card-face-color'))) < 1.1;
};

const { hsl, rgb, hex, alpha, color } = useColor();

function setValue(type: 'rgb' | 'hsl' | 'alpha', i: number, val: number) {
	if (type === 'rgb') {
		const newArray = [...rgb.value];
		newArray[i] = val;
		rgb.value = newArray;
	} else if (type === 'hsl') {
		const newArray = [...hsl.value];
		newArray[i] = val;
		hsl.value = newArray;
	} else {
		alpha.value = val;
	}
}

function setSwatchValue(color: string) {
	hex.value = `${color}${hex.value !== null && hex.value.length === 9 ? hex.value.slice(-2) : ''}`;
}

function unsetColor() {
	emit('input', null);
}

function activateColorPicker() {
	(htmlColorInput.value?.$el as HTMLElement).getElementsByTagName('input')[0].click();
}

function useColor() {
	const color = ref<Color | null>(null);

	const getHexa = (): string | null => {
		if (color.value !== null) {
			let alpha = Math.round(255 * color.value.alpha())
				.toString(16)
				.toUpperCase();

			alpha = alpha.padStart(2, '0');
			return color.value.rgb().array().length === 4 ? `${color.value.hex()}${alpha}` : color.value.hex();
		}

		return null;
	};

	watch(
		() => props.value,
		() => {
			color.value = valueWithoutVariables.value !== null ? Color(valueWithoutVariables.value) : null;
		},
		{ immediate: true }
	);

	const rgb = computed<number[]>({
		get() {
			if (color.value !== null) {
				return roundColorValues(color.value.rgb().array());
			}

			return roundColorValues(props.opacity ? [0, 0, 0, 1] : [0, 0, 0]);
		},
		set(newRGB) {
			setColor(Color.rgb(newRGB).alpha(newRGB.length === 4 ? newRGB[3] : 1));
		},
	});

	const hsl = computed<number[]>({
		get() {
			if (color.value !== null) {
				return roundColorValues(color.value.hsl().array());
			}

			return roundColorValues(props.opacity ? [0, 0, 0, 1] : [0, 0, 0]);
		},
		set(newHSL) {
			setColor(Color.hsl(newHSL).alpha(newHSL.length === 4 ? newHSL[3] : 1));
		},
	});

	const hex = computed<string | null>({
		get() {
			return getHexa();
		},
		set(newHex) {
			if (newHex === null || newHex === '') {
				unsetColor();
			} else {
				if (isHex(newHex) === false) return;
				setColor(Color(newHex));
			}
		},
	});

	const alpha = computed<number>({
		get() {
			return color.value !== null ? Math.round(color?.value?.alpha() * 100) : 100;
		},
		set(newAlpha) {
			if (newAlpha === null) {
				return;
			}

			const newColor = color.value !== null ? color.value.rgb().array() : [0, 0, 0];
			setColor(Color(newColor).alpha(newAlpha / 100));
		},
	});

	return { rgb, hsl, hex, alpha, color };

	function setColor(newColor: Color | null) {
		color.value = newColor;

		if (newColor === null) {
			unsetColor();
		} else {
			emit('input', getHexa());
		}
	}

	function roundColorValues(arr: number[]): number[] {
		if (arr.length === 4) {
			// Do not round the opacity
			return [...arr.slice(0, -1).map((x) => Math.round(x)), arr[3]];
		}

		return arr.map((x) => Math.round(x));
	}
}
</script>

<style scoped lang="scss">
.swatch {
	--v-button-padding: 6px;
	--v-button-background-color: transparent;
	--v-button-background-color-hover: var(--v-button-background-color);

	position: relative;
	box-sizing: border-box;
	margin-left: -8px;
	width: calc(var(--input-height) - 20px);
	max-height: calc(var(--input-height) - 20px);
	overflow: hidden;
	border-radius: calc(var(--border-radius) + 2px);
	cursor: pointer;
}

.presets {
	display: flex;
	width: 100%;
	margin-bottom: 14px;
	padding: 8px;
	overflow-x: auto;
}

.presets .preset {
	--v-button-background-color-hover: var(--v-button-background-color);
	--v-button-height: 20px;
	--v-button-width: 20px;

	margin: 0px 4px;

	&.low-contrast {
		--v-button-height: 18px;
		--v-button-width: 18px;
		border: 1px solid var(--border-normal-alt);
	}
}

.presets .preset:first-child {
	padding-left: 0px;
}

.presets .preset:last-child {
	padding-right: 0px;
}

.color-input {
	.v-input.html-color-select {
		width: 0;
		height: 0;
		visibility: hidden;
	}
}

.color-data-inputs {
	display: grid;
	grid-gap: 0px;
	width: 100%;
	padding: 12px 10px;
}

.color-data-inputs .color-data-input {
	--border-radius: 0px;
}

.color-data-inputs .color-data-input :deep(.input:focus-within),
.color-data-inputs .color-data-input :deep(.input:active),
.color-data-inputs .color-data-input :deep(.input:focus),
.color-data-inputs .color-data-input :deep(.input:hover),
.color-data-inputs .color-data-input :deep(.input.active) {
	z-index: 1;
}

.color-data-inputs .color-data-input:not(.color-type) {
	--input-padding: 12px 8px;
}

.color-data-inputs .color-data-input:not(:first-child) :deep(.input) {
	margin-left: calc(-1 * var(--border-width));
}

.color-data-inputs .color-data-input:first-child {
	--border-radius: 4px 0px 0px 4px;
}

.color-data-inputs .color-data-input:last-child {
	--border-radius: 0px 4px 4px 0px;
}

.color-data-inputs.stacked .color-data-input:not(:first-child) :deep(.input) {
	margin-top: calc(-2 * var(--border-width));
	margin-left: initial;
}

.color-data-inputs.stacked .color-data-input:not(:first-child):not(:nth-child(2)) :deep(.input) {
	margin-left: calc(-1 * var(--border-width));
}

.color-data-inputs.stacked .color-data-input:first-child {
	--border-radius: 4px 4px 0px 0px;
}

.color-data-inputs.stacked .color-data-input:nth-child(2) {
	--border-radius: 0px 0px 0px 4px;
}

.color-data-inputs.stacked .color-data-input:last-child {
	--border-radius: 0px 0px 4px 0px;
}

.color-data-alphas {
	display: grid;
	grid-gap: 12px;
	align-items: baseline;
	width: 100%;
	height: 45px;
	padding: 12px 14px;
}

.color-data-alphas .color-data-alpha {
	display: grid;
}

.color-data-alphas .color-data-alpha .slider input {
	background-color: transparent;
}
</style>
