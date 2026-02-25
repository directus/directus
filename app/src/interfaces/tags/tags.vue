<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { computed, ref, watch } from 'vue';
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';

const props = withDefaults(
	defineProps<{
		value: string[] | string | null;
		disabled?: boolean;
		nonEditable?: boolean;
		placeholder?: string;
		whitespace?: string | null;
		capitalization?: string | null;
		alphabetize?: boolean;
		iconLeft?: string;
		iconRight?: string;
		presets?: string[];
		allowCustom?: boolean;
		direction?: string;
		rawEditorEnabled?: boolean;
	}>(),
	{
		iconRight: 'local_offer',
		allowCustom: true,
	},
);

const emit = defineEmits(['input']);

const presetVals = computed<string[]>(() => {
	if (props.presets !== undefined) return processArray(props.presets);
	return [];
});

function isStringValue(val: unknown): val is string {
	return props.rawEditorEnabled === true && typeof val === 'string';
}

const isVariableMode = ref(isStringValue(props.value));

const selectedValsLocal = ref<string[]>(Array.isArray(props.value) ? processArray(props.value) : []);

watch(
	() => props.value,
	(newVal) => {
		isVariableMode.value = isStringValue(newVal);

		if (Array.isArray(newVal)) {
			selectedValsLocal.value = processArray(newVal);
		}

		if (newVal === null) selectedValsLocal.value = [];
	},
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

		const whitespace = props.whitespace === undefined || props.whitespace === null ? ' ' : props.whitespace;

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

function onInput(event: KeyboardEvent) {
	if (event.target && (event.key === 'Enter' || event.key === ',' || (event.type === 'blur' && document.hasFocus()))) {
		event.preventDefault();
		addTag((event.target as HTMLInputElement).value);
		(event.target as HTMLInputElement).value = '';
	}
}

function toggleTag(tag: string) {
	if (selectedVals.value.includes(tag)) {
		removeTag(tag);
	} else {
		addTag(tag);
	}
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

function clearVariable() {
	isVariableMode.value = false;
	emit('input', null);
}
</script>

<template>
	<div class="interface-tags">
		<VInput v-if="isVariableMode" :model-value="value as string" readonly>
			<template #append>
				<span class="remove-variable">
					<VIcon v-tooltip="$t('interfaces.tags.remove_variable')" name="close" clickable @click.stop="clearVariable" />
				</span>
			</template>
		</VInput>
		<VInput
			v-else-if="allowCustom"
			:placeholder="placeholder || $t('interfaces.tags.add_tags')"
			:disabled
			:non-editable
			:dir="direction"
			@keydown="onInput"
			@blur="onInput"
		>
			<template v-if="iconLeft" #prepend><VIcon :name="iconLeft" /></template>
			<template #append><VIcon :name="iconRight" /></template>
		</VInput>
		<div v-if="presetVals.length > 0 || customVals.length > 0" class="tags">
			<span v-if="presetVals.length > 0" class="presets tag-container">
				<VChip
					v-for="preset in presetVals"
					:key="preset"
					:class="['tag', { inactive: !selectedVals.includes(preset), 'non-editable': nonEditable }]"
					:disabled
					:dir="direction"
					small
					label
					clickable
					@click="toggleTag(preset)"
				>
					{{ preset }}
				</VChip>
			</span>
			<span v-if="customVals.length > 0 && allowCustom" class="custom tag-container">
				<VIcon
					v-if="presetVals.length > 0"
					:class="{ disabled: disabled && !nonEditable }"
					class="custom-tags-delimiter"
					name="chevron_right"
				/>
				<VChip
					v-for="val in customVals"
					:key="val"
					:dir="direction"
					:disabled
					:class="{ 'non-editable': nonEditable }"
					class="tag"
					small
					label
					clickable
					@click="removeTag(val)"
				>
					{{ val }}
				</VChip>
			</span>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.remove-variable {
	display: flex;

	--v-icon-color-hover: var(--v-remove-color, var(--theme--danger));
}

.tags {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-start;
	padding: 4px 0 0;

	span.tag-container {
		display: contents;
	}

	.custom-tags-delimiter,
	.tag {
		margin-block-start: 8px;
		margin-inline-end: 8px;
	}

	.custom-tags-delimiter.disabled {
		--v-icon-color: var(--theme--form--field--input--foreground-subdued);
	}

	.presets {
		.v-chip {
			--v-chip-background-color: var(--theme--primary);
			--v-chip-color: var(--foreground-inverted);
			--v-chip-background-color-hover: var(--theme--danger);
			--v-chip-border-color-hover: var(--v-chip-background-color-hover);
			--v-chip-color-hover: var(--foreground-inverted);

			&.inactive {
				--v-chip-background-color: var(--theme--form--field--input--background-subdued);
				--v-chip-color: var(--theme--form--field--input--foreground-subdued);
				--v-chip-background-color-hover: var(--theme--primary);
				--v-chip-color-hover: var(--foreground-inverted);
			}
		}
	}

	.custom {
		.v-chip {
			--v-chip-background-color: var(--theme--primary);
			--v-chip-color: var(--foreground-inverted);
			--v-chip-background-color-hover: var(--theme--danger);
			--v-chip-border-color-hover: var(--v-chip-background-color-hover);
			--v-chip-close-color: var(--v-chip-background-color, var(--theme--background-normal));
			--v-chip-close-color-hover: var(--white);

			transition: all var(--fast) var(--transition);

			&:hover {
				--v-chip-close-color: var(--white);

				:deep(.chip-content .close-outline .close:hover) {
					--v-icon-color: var(--theme--danger);
				}
			}
		}
	}
	.presets,
	.custom {
		.v-chip {
			&.disabled:not(.inactive):not(.non-editable) {
				--v-chip-background-color: var(--theme--form--field--input--background-subdued);
				--v-chip-color: var(--theme--form--field--input--foreground-subdued);
				--v-chip-border-color: var(--theme--form--field--input--border-color);

				&:hover {
					border-color: var(--v-chip-border-color);
				}
			}
		}
	}
}
</style>
