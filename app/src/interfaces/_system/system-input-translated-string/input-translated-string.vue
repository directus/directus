<template>
	<div class="input-translated-string">
		<v-menu ref="menuEl" :disabled="disabled" :close-on-content-click="false" attached>
			<template #activator="{ toggle, active }">
				<v-input
					class="translation-input"
					:model-value="localValue"
					:autofocus="autofocus"
					:placeholder="placeholder"
					:disabled="disabled"
					:active="active"
					@update:model-value="localValue = $event"
					@focus="isFocused = true"
					@blur="blur"
					@keydown.enter="checkKeyValidity"
				>
					<template v-if="hasValidKey" #input>
						<button :disabled="disabled" @click.stop="setValue(null)">{{ value && getKeyWithoutPrefix(value) }}</button>
					</template>
					<template #append>
						<v-icon
							name="translate"
							class="translate-icon"
							:class="{ active }"
							clickable
							:tabindex="-1"
							:disabled="disabled"
							@click="toggle"
						/>
					</template>
				</v-input>
			</template>

			<div v-if="searchValue !== null || translations.length >= 25" class="search">
				<v-input
					class="search-input"
					type="text"
					:model-value="searchValue"
					autofocus
					:placeholder="t('interfaces.input-translated-string.search_placeholder')"
					@update:model-value="searchValue = $event"
				>
					<template #append>
						<v-icon name="search" class="search-icon" />
					</template>
				</v-input>
			</div>

			<v-list>
				<v-list-item
					v-for="translation in translations"
					:key="translation.key"
					class="translation-key"
					:class="{ selected: localValue && translation.key === localValueWithoutPrefix }"
					clickable
					@click="selectKey(translation.key!)"
				>
					<v-list-item-icon>
						<v-icon name="translate" />
					</v-list-item-icon>
					<v-list-item-content><v-highlight :text="translation.key" :query="searchValue" /></v-list-item-content>
					<v-list-item-icon class="info">
						<TranslationStringsTooltip :translations="translation.translations" hide-display-text />
					</v-list-item-icon>
				</v-list-item>
				<v-list-item class="new-translation-string" clickable @click="openNewTranslationStringDialog">
					<v-list-item-icon>
						<v-icon name="add" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ t('interfaces.input-translated-string.new_translation_string') }}
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>

		<TranslationStringsDrawer
			:model-value="isTranslationStringDialogOpen"
			:translation-string="editingTranslationString"
			@update:model-value="updateTranslationStringsDialog"
			@saved-key="setValue(`${translationPrefix}${$event}`)"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslationStrings, TranslationString } from '@/composables/use-translation-strings';
import TranslationStringsDrawer from '@/modules/settings/routes/translation-strings/translation-strings-drawer.vue';
import TranslationStringsTooltip from '@/modules/settings/routes/translation-strings/translation-strings-tooltip.vue';

const translationPrefix = '$t:';

interface Props {
	value?: string | null;
	autofocus?: boolean;
	disabled?: boolean;
	placeholder?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
	value: () => null,
	autofocus: false,
	disabled: false,
	placeholder: () => null,
});

const emit = defineEmits(['input']);

const { t } = useI18n();

const menuEl = ref();
const hasValidKey = ref<boolean>(false);
const isFocused = ref<boolean>(false);
const searchValue = ref<string | null>(null);

const { translationStrings } = useTranslationStrings();

const isTranslationStringDialogOpen = ref<boolean>(false);

const editingTranslationString = ref<TranslationString | null>(null);

const translations = computed(() => {
	const keys = translationStrings.value ?? [];

	return !searchValue.value ? keys : keys.filter((key) => key.key?.includes(searchValue.value!));
});

const localValue = computed<string | null>({
	get() {
		return props.value;
	},
	set(val) {
		if (props.value === val) return;
		emit('input', val);
	},
});

watch(
	() => props.value,
	(newVal) => setValue(newVal),
	{ immediate: true }
);

const localValueWithoutPrefix = computed(() => (localValue.value ? getKeyWithoutPrefix(localValue.value) : null));

function getKeyWithoutPrefix(val: string) {
	return val.substring(translationPrefix.length);
}

function selectKey(key: string) {
	setValue(`${translationPrefix}${key}`);
	menuEl.value.deactivate();
	searchValue.value = null;
}

function setValue(newValue: string | null) {
	if (newValue?.startsWith(translationPrefix)) newValue = newValue.replace(/\s/g, '_');
	localValue.value = newValue;
	if (!isFocused.value) checkKeyValidity();
}

function blur() {
	isFocused.value = false;
	checkKeyValidity();
}

function checkKeyValidity() {
	hasValidKey.value = localValue.value?.startsWith(translationPrefix) ?? false;
}

function openNewTranslationStringDialog() {
	menuEl.value.deactivate();
	isTranslationStringDialogOpen.value = true;
}

function updateTranslationStringsDialog(val: boolean) {
	if (val) return;

	editingTranslationString.value = null;
	isTranslationStringDialogOpen.value = val;
}
</script>

<style lang="scss" scoped>
.translation-input {
	:deep(button) {
		margin-right: auto;
		padding: 2px 8px 0;
		color: var(--primary);
		background-color: var(--primary-alt);
		border-radius: var(--border-radius);
		transition: var(--fast) var(--transition);
		transition-property: background-color, color;
		user-select: none;
		font-family: var(--family-monospace);
	}

	:deep(button:not(:disabled):hover) {
		color: var(--white);
		background-color: var(--danger);
	}

	.translate-icon {
		&:hover,
		&.active {
			--v-icon-color-hover: var(--primary);
			--v-icon-color: var(--primary);
		}
	}
}

.search {
	padding: 12px 8px 6px 8px;

	.search-input {
		--input-height: 48px;
	}

	.search-icon {
		pointer-events: none;
	}
}

.translation-key {
	transition: color var(--fast) var(--transition);

	.info :deep(.icon) {
		transition: opacity var(--fast) var(--transition);
		opacity: 0;
	}

	&:hover .info :deep(.icon) {
		opacity: 1;
	}

	:deep(mark) {
		flex-basis: auto;
		flex-grow: 0;
		flex-shrink: 1;
		color: var(--primary);
	}

	&.selected {
		--v-list-item-color-active: var(--foreground-inverted);
		--v-list-item-background-color-active: var(--primary);
		--v-list-item-color-hover: var(--foreground-inverted);
		--v-list-item-background-color-hover: var(--primary);

		background-color: var(--primary);
		color: var(--foreground-inverted);

		.v-list-item-icon {
			--v-icon-color: var(--foreground-inverted);
		}

		.info :deep(.icon) {
			color: var(--foreground-inverted);
			opacity: 1;
		}
	}
}

.new-translation-string {
	--v-list-item-color-hover: var(--primary-125);

	color: var(--primary);

	.v-list-item-icon {
		--v-icon-color: var(--primary);
	}
}
</style>
