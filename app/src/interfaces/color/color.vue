<template>
	<v-menu attached :disabled="disabled">
		<template #activator="{ toggle, active, activate }">
			<v-input
				:disabled="disabled"
				:placeholder="$t('choose_a_color')"
				v-model="hexValue"
				@focus="activate"
				:pattern="/#([a-f\d]{2}){3}/i"
				class="color-input"
				maxlength="7"
			>
				<template #prepend>
					<v-input type="color" class="html-color-select" v-model="hexValue" ref="htmlColorInput" />
					<v-button
						@click="activateColorPicker"
						class="swatch"
						:icon="true"
						:style="{
							'--v-button-background-color': isValidColor ? hexValue : 'transparent',
							border: isValidColor ? 'none' : 'var(--border-width) solid var(--border-normal)',
						}"
					>
						<v-icon v-if="!isValidColor" name="colorize" />
					</v-button>
				</template>
				<template #append>
					<v-icon name="palette" />
				</template>
			</v-input>
		</template>

		<div class="color-data-inputs">
			<div class="color-data-input color-type">
				<v-select :items="colorTypes" v-model="colorType" />
			</div>
			<template v-if="colorType === 'RGB'">
				<v-input
					:value="rgb.r"
					@input="rgb = { ...rgb, r: $event }"
					class="color-data-input"
					pattern="\d*"
					:min="0"
					:max="255"
					:step="1"
					maxlength="3"
				/>
				<v-input
					:value="rgb.g"
					@input="rgb = { ...rgb, g: $event }"
					class="color-data-input"
					pattern="\d*"
					:min="0"
					:max="255"
					:step="1"
					maxlength="3"
				/>
				<v-input
					:value="rgb.b"
					@input="rgb = { ...rgb, b: $event }"
					class="color-data-input"
					pattern="\d*"
					:min="0"
					:max="255"
					:step="1"
					maxlength="3"
				/>
			</template>
			<template v-if="colorType === 'HSL'">
				<v-input
					:value="hsl.h"
					@input="hsl = { ...hsl, h: $event }"
					class="color-data-input"
					pattern="\d*"
					:min="0"
					:max="360"
					:step="1"
					maxlength="3"
				/>
				<v-input
					:value="hsl.s"
					@input="hsl = { ...hsl, s: $event }"
					class="color-data-input"
					pattern="\d*"
					:min="0"
					:max="100"
					:step="1"
					maxlength="3"
				/>
				<v-input
					:value="hsl.l"
					@input="hsl = { ...hsl, l: $event }"
					class="color-data-input"
					pattern="\d*"
					:min="0"
					:max="100"
					:step="1"
					maxlength="3"
				/>
			</template>
		</div>
		<div class="presets" v-if="presets">
			<v-button
				v-for="preset in presets"
				:key="preset.color"
				class="preset"
				rounded
				icon
				:style="{ '--v-button-background-color': preset.color }"
				v-tooltip="preset.name"
				@click="() => (hexValue = preset.color)"
			/>
		</div>
	</v-menu>
</template>
<script lang="ts">
import { defineComponent, ref, computed, PropType, watch } from '@vue/composition-api';
import color, { RGB, HSL } from '@/utils/color';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: String,
			default: null,
			validator: (val: string) => val === null || val === '' || color.isHex(val),
		},
		presets: {
			type: Array as PropType<string[]>,
			default: () => [
				{
					name: 'Red',
					color: '#EB5757',
				},
				{
					name: 'Orange',
					color: '#F2994A',
				},
				{
					name: 'Yellow',
					color: '#F2C94C',
				},
				{
					name: 'Teal',
					color: '#6FCF97',
				},
				{
					name: 'Green',
					color: '#27AE60',
				},
				{
					name: 'Light Blue',
					color: '#56CCF2',
				},
				{
					name: 'Blue',
					color: '#2F80ED',
				},
				{
					name: 'Purple',
					color: '#9B51E0',
				},
				{
					name: 'Pink',
					color: '#BB6BD9',
				},
				{
					name: 'Gray',
					color: '#607D8B',
				},
			],
		},
	},
	setup(props, { emit }) {
		const htmlColorInput = ref<Vue | null>(null);
		type ColorType = 'RGB' | 'HSL';

		const colorTypes = ['RGB', 'HSL'] as ColorType[];
		const colorType = ref<ColorType>('RGB');

		function activateColorPicker() {
			(htmlColorInput.value?.$el as HTMLElement).getElementsByTagName('input')[0].click();
		}

		const isValidColor = computed<boolean>(() => hexValue.value != null && color.isHex(hexValue.value as string));

		const { rgb, hsl, hexValue } = useColor();

		return {
			colorTypes,
			colorType,
			rgb,
			hsl,
			hexValue,
			htmlColorInput,
			activateColorPicker,
			isValidColor,
		};

		function useColor() {
			const hexValue = ref<string | null>(props.value);

			watch(hexValue, (newHex) => {
				if (newHex === props.value) return;

				if (!newHex) emit('input', null);
				else if (newHex.length === 0) emit('input', null);
				else if (newHex.length === 7) emit('input', newHex);
			});

			watch(
				() => props.value,
				(newValue) => {
					if (newValue === hexValue.value) return;

					if (newValue !== null && color.isHex(newValue)) {
						hexValue.value = props.value;
					}

					if (newValue === null) {
						hexValue.value = null;
					}
				}
			);

			const hsl = computed<HSL<string | null>>({
				get() {
					return color.hexToHsl(hexValue.value);
				},
				set(newHSL) {
					hexValue.value = color.hslToHex(newHSL);
				},
			});

			const rgb = computed<RGB<string | null>>({
				get() {
					return color.hexToRgb(hexValue.value);
				},
				set(newRGB) {
					hexValue.value = color.rgbToHex(newRGB);
				},
			});

			return { rgb, hsl, hexValue };
		}
	},
});
</script>

<style lang="scss" scoped>
.swatch {
	/* --v-button-height: calc(var(--input-height) - 12px);
	--v-button-width: calc(var(--input-height) - 12px);
	--v-button-min-height: none;
	--v-button-max-height: calc(var(--input-height) - 12px); */
	--v-button-padding: 6px;
	--v-button-background-color: transparent;
	--v-button-background-color-hover: var(--v-button-background-color);

	position: relative;
	box-sizing: border-box;
	width: calc(var(--input-height) - 12px);
	max-height: calc(var(--input-height) - 12px);
	overflow: hidden;
	border-radius: var(--border-radius);
	cursor: pointer;
}

.presets {
	display: flex;
	width: 100%;
	padding: 0px 8px 14px 8px;

	.preset {
		--v-button-background-color-hover: var(--v-button-background-color);
		--v-button-height: 20px;
		--v-button-width: 20px;

		padding: 0px 4px;

		&:first-child {
			padding-left: 0px;
		}
		&:last-child {
			padding-right: 0px;
		}
	}
}

.v-input.html-color-select {
	display: none;
}

.color-input {
	--input-padding: 12px 12px 12px 4px;
}

.color-data-inputs {
	display: grid;
	grid-gap: 0px;
	grid-template-columns: repeat(5, 1fr);
	width: 100%;
	padding: 12px 10px;

	.color-type {
		grid-column: 1 / span 2;
	}

	.color-data-input {
		--border-radius: 0px;

		&::v-deep .input:focus-within,
		&::v-deep .input:active,
		&::v-deep .input:focus,
		&::v-deep .input:hover,
		&::v-deep .input.active {
			z-index: 1;
		}

		&:not(.color-type) {
			--input-padding: 12px 8px;
		}

		&:not(:first-child)::v-deep .input {
			margin-left: calc(-1 * var(--border-width));
		}

		/* stylelint-disable indentation */
		&:not(:last-child)::v-deep .input:not(.active):not(:focus-within):not(:hover):not(:active):not(:focus) {
			border-right-color: transparent;
		}

		&:first-child {
			--border-radius: 4px 0px 0px 4px;
		}

		&:last-child {
			--border-radius: 0px 4px 4px 0px;
		}
	}
}
</style>
