<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VMenu from '@/components/v-menu.vue';
import VRemove from '@/components/v-remove.vue';
import VSelect from '@/components/v-select/v-select.vue';
import VSlider from '@/components/v-slider.vue';
import { isCssVar as isCssVarUtil } from '@/utils/is-css-var';
import { isHex } from '@/utils/is-hex';
import { cssVar } from '@directus/utils/browser';
import Color, { ColorInstance } from 'color';
import { ComponentPublicInstance, computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
	disabled?: boolean;
	nonEditable?: boolean;
	value?: string | null;
	placeholder?: string;
	presets?: { name: string; color: string }[];
	width: string;
	opacity?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
	nonEditable: false,
	value: null,
	placeholder: undefined,
	opacity: false,
});

// Reactive translations can't be default values of props
const presetsWithDefaults = computed(
	() =>
		props.presets || [
			{
				name: t('colors.purple'),
				color: '#6644FF',
			},
			{
				name: t('colors.blue'),
				color: '#3399FF',
			},
			{
				name: t('colors.green'),
				color: '#2ECDA7',
			},
			{
				name: t('colors.yellow'),
				color: '#FFC23B',
			},
			{
				name: t('colors.orange'),
				color: '#FFA439',
			},
			{
				name: t('colors.red'),
				color: '#E35169',
			},
			{
				name: t('colors.black'),
				color: '#18222F',
			},
			{
				name: t('colors.gray'),
				color: '#A2B5CD',
			},
			{
				name: t('colors.white'),
				color: '#FFFFFF',
			},
		],
);

const emit = defineEmits(['input']);

const isCssVar = computed(() => {
	if (!props.value) return false;
	return isCssVarUtil(props.value);
});

const valueWithoutVariables = computed(() => {
	if (!props.value) return null;
	return isCssVar.value ? cssVar(props.value.substring(4, props.value.length - 1)) : props.value;
});

const htmlColorInput = ref<ComponentPublicInstance | null>(null);
type ColorType = 'RGB' | 'HSL' | 'RGBA' | 'HSLA';

const colorTypes = props.opacity ? ref<ColorType[]>(['RGBA', 'HSLA']) : ref<ColorType[]>(['RGB', 'HSL']);
const colorType = ref<ColorType>(props.opacity ? 'RGBA' : 'RGB');

const isValidColor = computed<boolean>(() => rgb.value !== null && valueWithoutVariables.value !== null);

const lowContrast = computed(() => {
	if (color.value === null) return true;

	const pageColorString = cssVar('--theme--form--field--input--background');

	try {
		const pageColor = Color(pageColorString);
		return color.value.contrast(pageColor) < 1.1;
	} catch {
		return true;
	}
});

const getPresetContrast = (hex: string) => {
	if (hex.startsWith('--')) hex = cssVar(hex);
	const color = Color(hex);
	return color.contrast(Color(cssVar('--theme--popover--menu--background'))) < 1.1;
};

const { hsl, rgb, hex, alpha, color, input, onChanged } = useColor();

const showSwatch = computed(() => {
	if (color.value) return true;
	if (isCssVar.value) return true;
	return false;
});

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
	htmlColorInput.value?.$el.getElementsByTagName('input')[0]?.click();
}

function onClickInput(e: InputEvent, toggle: () => void) {
	if ((e.target as HTMLInputElement).tagName === 'INPUT') toggle();
}

function onKeydownInput(e: KeyboardEvent, activate: () => void) {
	const systemKeys = e.metaKey || e.altKey || e.ctrlKey || e.shiftKey || e.key === 'Tab';

	if (!e.repeat && !systemKeys && (e.target as HTMLInputElement).tagName === 'INPUT') activate();
}

function useColor() {
	const color = ref<ColorInstance | null>(null);

	const getHexa = (): string | null => {
		if (color.value !== null) {
			if (!props.opacity || color.value.rgb().array().length !== 4) return color.value.hex();

			let alpha = Math.round(255 * color.value.alpha())
				.toString(16)
				.toUpperCase();

			alpha = alpha.padStart(2, '0');
			return `${color.value.hex()}${alpha}`;
		}

		return null;
	};

	watch(
		() => props.value,
		() => {
			try {
				color.value = valueWithoutVariables.value !== null ? Color(valueWithoutVariables.value) : null;
			} catch {
				color.value = null;
			}
		},
		{ immediate: true },
	);

	const rgb = computed<number[]>({
		get() {
			if (color.value !== null) {
				return roundColorValues(color.value.rgb().array());
			}

			return roundColorValues(props.opacity ? [0, 0, 0, 1] : [0, 0, 0]);
		},
		set(newRGB) {
			setColor(Color.rgb(newRGB).alpha(newRGB.length === 4 ? newRGB[3]! : 1));
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
			setColor(Color.hsl(newHSL).alpha(newHSL.length === 4 ? newHSL[3]! : 1));
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

	const input = computed<string | null>({
		get() {
			return props.value;
		},
		set(newInput) {
			if (newInput === null || newInput === '') {
				unsetColor();
				return;
			}

			emit('input', newInput);

			if (isCssVarUtil(newInput)) {
				try {
					color.value = Color(cssVar(newInput.substring(4, newInput.length - 1)));
				} catch {
					// Color or cssVar could not resolve the color to a color in JS, however, the CSS Var may still be a valid color.
					// So we keep the input value as is and set the internal color to null.
					// This way the user can still edit the input and we can still show the color in the swatch.
					// The color editor (rgb/hsl) will show the color as black (0,0,0) in this case.
					color.value = null;
				}
			}
		},
	});

	return { rgb, hsl, hex, alpha, color, input, onChanged };

	function onChanged() {
		if (!input.value) {
			unsetColor();
			return;
		}

		if (isCssVarUtil(input.value)) return;

		try {
			// If the input is a valid color, we set the color and emit the input as a hex value which is consistent with the dropdown selector and HTML color picker
			const newColor = Color(input.value);
			setColor(newColor);
		} catch {
			// The input is not a valid color, but we still want to let the user edit/type in the input so we emit null to prevent using an invalid value
			unsetColor();
		}
	}

	function setColor(newColor: ColorInstance | null) {
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
			return [...arr.slice(0, -1).map((x) => Math.round(x)), arr[3]!];
		}

		return arr.map((x) => Math.round(x));
	}
}
</script>

<template>
	<v-menu attached :disabled="disabled" :close-on-content-click="false" no-focus-return>
		<template #activator="{ activate, toggle }">
			<v-input
				v-model="input"
				:disabled
				:non-editable
				:placeholder="placeholder || $t('interfaces.select-color.placeholder')"
				:pattern="opacity ? /#([a-f\d]{2}){4}/i : /#([a-f\d]{2}){3}/i"
				class="color-input"
				:maxlength="opacity ? 9 : 7"
				@change="onChanged"
				@click="onClickInput($event, toggle)"
				@keydown="onKeydownInput($event, activate)"
			>
				<template #prepend>
					<v-input
						ref="htmlColorInput"
						:model-value="hex ? hex.slice(0, 7) : null"
						type="color"
						class="html-color-select"
						@click.stop
						@update:model-value="setSwatchValue($event)"
					/>
					<v-button
						class="swatch"
						icon
						:style="{
							'--swatch-color': showSwatch ? value : 'transparent',
							...(lowContrast === false ? { '--theme--border-width': '0px' } : {}),
							border:
								lowContrast === false
									? 'none'
									: 'var(--theme--border-width) solid var(--theme--form--field--input--border-color)',
						}"
						@click="activateColorPicker"
					>
						<v-icon v-if="!isValidColor" name="colorize" />
						<v-icon v-else-if="!showSwatch" name="question_mark" />
					</v-button>
				</template>
				<template #append>
					<div v-if="!nonEditable" class="item-actions">
						<v-remove v-if="isValidColor" deselect @action="unsetColor" />

						<v-icon v-else name="palette" clickable @click="toggle" />
					</div>
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
						'--theme--background': 'none',
						'--v-slider-fill-color': 'none',
						'--v-slider-thumb-color': 'var(--theme--form--field--input--foreground)',
						'--v-slider-track-background-image':
							'linear-gradient(to right, transparent,' +
							(hex && hex.length === 9 ? hex.slice(0, -2) : hex ? hex : 'transparent') +
							'), url(\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==\')',
					}"
					@update:model-value="setValue('alpha', 0, $event)"
				/>
			</div>
		</div>
		<div v-if="presetsWithDefaults" class="presets">
			<v-button
				v-for="preset in presetsWithDefaults"
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

<style scoped lang="scss">
@use '@/styles/mixins';

.item-actions {
	@include mixins.list-interface-item-actions;
}

.swatch {
	--v-button-padding: 6px;
	--v-button-background-color: transparent;
	background-color: var(--swatch-color, transparent);

	--v-button-background-color-hover: var(--v-button-background-color);
	--v-button-height: calc(var(--theme--form--field--input--height) - 20px);
	--v-button-width: calc(var(--theme--form--field--input--height) - 20px);
	--swatch-radius: calc(var(--theme--border-radius) + 2px);
	--focus-ring-offset: var(--focus-ring-offset-inset);
	--focus-ring-radius: var(--swatch-radius);

	position: relative;
	box-sizing: border-box;
	margin-inline-start: -8px;
	inline-size: calc(var(--theme--form--field--input--height) - 20px);
	block-size: calc(var(--theme--form--field--input--height) - 20px);
	border-radius: var(--swatch-radius);
	overflow: hidden;
	cursor: pointer;
}

.presets {
	display: flex;
	inline-size: 100%;
	margin-block-end: 14px;
	padding: 8px;
	overflow-x: auto;
}

.presets .preset {
	--v-button-background-color-hover: var(--v-button-background-color);
	--v-button-height: 20px;
	--v-button-width: 20px;

	margin: 0 4px;

	&.low-contrast {
		--v-button-height: 18px;
		--v-button-width: 18px;
		border: 1px solid var(--theme--form--field--input--border-color-hover);
	}
}

.presets .preset:first-child {
	padding-inline-start: 0;
}

.presets .preset:last-child {
	padding-inline-end: 0;
}

.color-input {
	.v-input.html-color-select {
		inline-size: 0;
		block-size: 0;
		visibility: hidden;
	}
}

.color-data-inputs {
	display: grid;
	gap: 0;
	inline-size: 100%;
	padding: 12px 10px;
}

.color-data-inputs .color-data-input {
	--v-input-border-radius: 0px;
}

.color-data-inputs .color-data-input :deep(.input:focus-within),
.color-data-inputs .color-data-input :deep(.input:active),
.color-data-inputs .color-data-input :deep(.input:focus),
.color-data-inputs .color-data-input :deep(.input:hover),
.color-data-inputs .color-data-input :deep(.input.active) {
	z-index: 1;
}

.color-data-inputs .color-data-input:not(.color-type) {
	--theme--form--field--input--padding: 12px 8px;
}

.color-data-inputs .color-data-input:not(:first-child) :deep(.input) {
	margin-inline-start: calc(-1 * var(--theme--border-width));
}

.color-data-inputs .color-data-input:first-child {
	--v-input-border-radius: var(--theme--border-radius) 0px 0px var(--theme--border-radius);
}

.color-data-inputs .color-data-input:last-child {
	--v-input-border-radius: 0px var(--theme--border-radius) var(--theme--border-radius) 0px;
}

.color-data-inputs.stacked .color-data-input:not(:first-child) :deep(.input) {
	margin-block-start: calc(-2 * var(--theme--border-width));
	margin-inline-start: initial;
}

.color-data-inputs.stacked .color-data-input:not(:first-child):not(:nth-child(2)) :deep(.input) {
	margin-inline-start: calc(-1 * var(--theme--border-width));
}

.color-data-inputs.stacked .color-data-input:first-child {
	--v-input-border-radius: var(--theme--border-radius) var(--theme--border-radius) 0px 0px;
}

.color-data-inputs.stacked .color-data-input:nth-child(2) {
	--v-input-border-radius: 0px 0px 0px var(--theme--border-radius);
}

.color-data-inputs.stacked .color-data-input:last-child {
	--v-input-border-radius: 0px 0px var(--theme--border-radius) 0px;
}

.color-data-alphas {
	display: grid;
	gap: 12px;
	align-items: baseline;
	inline-size: 100%;
	block-size: 45px;
	padding: 12px 14px;
}

.color-data-alphas .color-data-alpha {
	display: grid;
}

.color-data-alphas .color-data-alpha .slider input {
	background-color: transparent;
}
</style>
