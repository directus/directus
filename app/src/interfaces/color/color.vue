<template>
	<v-menu attached :disabled="disabled" v-model="menuActive" :close-on-content-click="false">
		<template #activator>
			<v-input
				:disabled="disabled"
				:placeholder="$t('interfaces.color.placeholder')"
				v-model="hex"
				:pattern="/#([a-f\d]{2}){3}/i"
				class="color-input"
				maxlength="7"
				@focus="menuActive = true"
			>
				<template #prepend>
					<v-input type="color" class="html-color-select" v-model="hex" ref="htmlColorInput" />
					<v-button
						@click="activateColorPicker"
						class="swatch"
						:icon="true"
						:style="{
							'--v-button-background-color': isValidColor ? hex : 'transparent',
							border: lowContrast === false ? 'none' : 'var(--border-width) solid var(--border-normal)',
						}"
					>
						<v-icon v-if="!isValidColor" name="colorize" />
					</v-button>
				</template>
				<template #append>
					<v-icon :name="isValidColor ? 'close' : 'palette'" @click="unsetColor" />
				</template>
			</v-input>
		</template>

		<div class="color-data-inputs" :class="{ stacked: width === 'half' }">
			<div class="color-data-input color-type">
				<v-select :items="colorTypes" v-model="colorType" />
			</div>
			<template v-if="colorType === 'RGB'">
				<v-input
					type="number"
					v-for="(val, i) in rgb"
					:key="i"
					:value="val"
					@input="setValue('rgb', i, $event)"
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
					type="number"
					v-for="(val, i) in hsl"
					:key="i"
					:value="val"
					@input="setValue('hsl', i, $event)"
					class="color-data-input"
					pattern="\d*"
					:min="0"
					:max="i === 0 ? 360 : 100"
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
				@click="() => (hex = preset.color)"
			/>
		</div>
	</v-menu>
</template>
<script lang="ts">
import { defineComponent, ref, computed, PropType, watch } from '@vue/composition-api';
import { isHex } from '@/utils/color';
import Color from 'color';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: String,
			default: null,
			validator: (val: string) => val === null || val === '' || isHex(val),
		},
		presets: {
			type: Array as PropType<string[]>,
			default: () => [
				{
					name: 'Red',
					color: '#E35169',
				},
				{
					name: 'Orange',
					color: '#F7971C',
				},
				{
					name: 'Yellow',
					color: '#F2C94C',
				},
				{
					name: 'Green',
					color: '#00C897',
				},
				{
					name: 'Blue',
					color: '#68B0F4',
				},
				{
					name: 'Purple',
					color: '#9E8DE4',
				},
				{
					name: 'Gray',
					color: '#607D8B',
				},
				{
					name: 'Light Gray',
					color: '#ECEFF1',
				},
			],
		},
		width: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const htmlColorInput = ref<Vue | null>(null);
		type ColorType = 'RGB' | 'HSL';

		const colorTypes = ['RGB', 'HSL'] as ColorType[];
		const colorType = ref<ColorType>('RGB');

		function unsetColor() {
			emit('input', null);
		}

		function activateColorPicker() {
			(htmlColorInput.value?.$el as HTMLElement).getElementsByTagName('input')[0].click();
		}

		const isValidColor = computed<boolean>(() => rgb.value !== null && props.value !== null);

		const lowContrast = computed(() => {
			if (color.value === null) return true;

			const pageColorString = getComputedStyle(document.body).getPropertyValue('--background-page').trim();
			const pageColor = Color(pageColorString);

			return color.value.contrast(pageColor) < 1.1;
		});

		const { hsl, rgb, hex, color } = useColor();

		const menuActive = ref(false);

		return {
			colorTypes,
			colorType,
			rgb,
			hsl,
			hex,
			htmlColorInput,
			activateColorPicker,
			isValidColor,
			menuActive,
			Color,
			setValue,
			lowContrast,
			unsetColor,
		};

		function setValue(type: 'rgb' | 'hsl', i: number, val: number) {
			if (type === 'rgb') {
				const newArray = [...rgb.value];
				newArray[i] = val;
				rgb.value = newArray;
			} else {
				const newArray = [...hsl.value];
				newArray[i] = val;
				hsl.value = newArray;
			}
		}

		function useColor() {
			const color = ref<Color | null>(null);

			watch(
				() => props.value,
				(newValue) => {
					color.value = newValue !== null ? Color(newValue) : null;
				},
				{ immediate: true }
			);

			const rgb = computed<number[]>({
				get() {
					return color.value !== null ? color.value.rgb().array().map(Math.round) : [0, 0, 0];
				},
				set(newRGB) {
					setColor(Color.rgb(newRGB));
				},
			});

			const hsl = computed<number[]>({
				get() {
					return color.value !== null ? color.value.hsl().array().map(Math.round) : [0, 0, 0];
				},
				set(newHSL) {
					setColor(Color.hsl(newHSL));
				},
			});

			const hex = computed<string | null>({
				get() {
					return color.value !== null ? color.value.hex() : null;
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

			return { rgb, hsl, hex, color };

			function setColor(newColor: Color | null) {
				color.value = newColor;

				if (newColor === null) {
					unsetColor();
				} else {
					emit('input', newColor.hex());
				}
			}
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
	border-radius: calc(var(--border-radius) + 2px);
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

		&:first-child {
			--border-radius: 4px 0px 0px 4px;
		}

		&:last-child {
			--border-radius: 0px 4px 4px 0px;
		}
	}

	&.stacked {
		grid-template-columns: repeat(3, 1fr);

		.color-type {
			grid-column: 1 / span 3;
		}

		.color-data-input {
			&:not(:first-child)::v-deep .input {
				margin-top: calc(-2 * var(--border-width));
				margin-left: initial;
			}

			&:not(:first-child):not(:nth-child(2))::v-deep .input {
				margin-left: calc(-1 * var(--border-width));
			}

			&:first-child {
				--border-radius: 4px 4px 0px 0px;
			}

			&:nth-child(2) {
				--border-radius: 0px 0px 0px 4px;
			}

			&:last-child {
				--border-radius: 0px 0px 4px 0px;
			}
		}
	}
}
</style>
