<template>
	<div class="interface-tags">
		<v-input
			:placeholder="placeholder || $t('interfaces.tags.add_tags')"
			@keydown="onInput"
			:disabled="disabled"
			v-if="allowCustom"
		>
			<template #prepend><v-icon v-if="iconLeft" :name="iconLeft" /></template>
			<template #append><v-icon :name="iconRight" /></template>
		</v-input>
		<div class="tags" v-if="presetVals.length > 0 || customVals.length > 0">
			<span v-if="presetVals.length > 0" class="presets tag-container">
				<v-chip
					v-for="preset in presetVals"
					:class="['tag', { inactive: !selectedVals.includes(preset) }]"
					:key="preset"
					:disabled="disabled"
					small
					label
					@click="toggleTag(preset)"
				>
					{{ preset }}
				</v-chip>
			</span>
			<span v-if="customVals.length > 0 && allowCustom" class="custom tag-container">
				<v-icon class="custom-tags-delimeter" v-if="presetVals.length > 0" name="chevron_right" />
				<v-chip
					v-for="val in customVals"
					:key="val"
					:disabled="disabled"
					class="tag"
					small
					label
					@click="removeTag(val)"
				>
					{{ val }}
				</v-chip>
			</span>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, watch } from '@vue/composition-api';
import formatTitle from '@directus/format-title';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Array as PropType<string[]>,
			default: null,
		},
		placeholder: {
			type: String,
			default: null,
		},
		whitespace: {
			type: String,
			default: null,
		},
		capitalization: {
			type: String as PropType<'uppercase' | 'lowercase' | 'auto-format'>,
			default: null,
		},
		alphabetize: {
			type: Boolean,
			default: false,
		},
		iconLeft: {
			type: String,
			default: null,
		},
		iconRight: {
			type: String,
			default: 'local_offer',
		},
		presets: {
			type: Array as PropType<string[]>,
			default: null,
		},
		allowCustom: {
			type: Boolean,
			default: true,
		},
	},
	setup(props, { emit }) {
		const presetVals = computed<string[]>(() => {
			if (props.presets !== null) return processArray(props.presets);
			return [];
		});

		const selectedValsLocal = ref<string[]>(processArray(props.value || []));

		watch(
			() => props.value,
			(newVal) => {
				if (Array.isArray(newVal)) {
					selectedValsLocal.value = processArray(newVal);
				}

				if (newVal === null) selectedValsLocal.value = [];
			}
		);

		const selectedVals = computed<string[]>(() => {
			let vals = processArray(selectedValsLocal.value);

			if (!props.allowCustom) {
				vals = vals.filter((val) => presetVals.value.includes(val));
			}

			return vals;
		});

		const customVals = computed<string[]>(() => {
			return selectedVals.value.filter((val) => !presetVals.value.includes(val));
		});

		function processArray(array: string[]): string[] {
			array = array.map((val) => {
				val = val.trim();
				if (props.capitalization === 'uppercase') val = val.toUpperCase();
				if (props.capitalization === 'lowercase') val = val.toLowerCase();

				const whitespace = props.whitespace === null ? ' ' : props.whitespace;

				if (props.capitalization === 'auto-format') val = formatTitle(val, new RegExp(whitespace));

				val = val.replace(/ +/g, whitespace);

				return val;
			});

			if (props.alphabetize) {
				array = array.concat().sort();
			}

			array = [...new Set(array)];

			return array;
		}

		return {
			onInput,
			addTag,
			removeTag,
			toggleTag,
			presetVals,
			customVals,
			selectedVals,
		};

		function onInput(event: KeyboardEvent) {
			if (event.target && (event.key === 'Enter' || event.key === ',')) {
				event.preventDefault();
				addTag((event.target as HTMLInputElement).value);
				(event.target as HTMLInputElement).value = '';
			}
		}

		function toggleTag(tag: string) {
			selectedVals.value.includes(tag) ? removeTag(tag) : addTag(tag);
		}

		function addTag(tag: string) {
			if (!tag || tag === '') return;
			// Remove any leading / trailing whitespace from the value
			tag = tag.trim();
			// Convert the tag to lowercase
			selectedValsLocal.value.push(tag);
			emitValue();
		}

		function removeTag(tag: string) {
			selectedValsLocal.value = selectedValsLocal.value.filter((savedTag) => savedTag !== tag);
			emitValue();
		}

		function emitValue() {
			emit('input', selectedVals.value);
		}
	},
});
</script>

<style lang="scss" scoped>
.tags {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-start;
	padding: 4px 0px 0px;

	span.tag-container {
		display: contents;
	}

	.custom-tags-delimeter,
	.tag {
		margin-top: 8px;
		margin-right: 8px;
	}

	.presets {
		.v-chip {
			--v-chip-background-color: var(--primary);
			--v-chip-color: var(--foreground-inverted);
			--v-chip-background-color-hover: var(--danger);
			--v-chip-color-hover: var(--foreground-inverted);
			&.inactive {
				--v-chip-background-color: var(--background-subdued);
				--v-chip-color: var(--foreground-subdued);
				--v-chip-background-color-hover: var(--primary);
				--v-chip-color-hover: var(--foreground-inverted);
			}
		}
	}

	.custom {
		.v-chip {
			transition: all var(--fast) var(--transition);
			--v-chip-background-color: var(--primary);
			--v-chip-color: var(--foreground-inverted);
			--v-chip-background-color-hover: var(--danger);
			--v-chip-close-color: var(--v-chip-background-color);
			--v-chip-close-color-hover: var(--white);

			&:hover {
				--v-chip-close-color: var(--white);
				::v-deep .chip-content .close-outline .close:hover {
					--v-icon-color: var(--danger);
				}
			}
		}
	}
}
</style>
