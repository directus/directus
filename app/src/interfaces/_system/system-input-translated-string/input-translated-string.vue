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

			<div v-if="searchValue !== null || filteredTranslationKeys.length >= 25" class="search">
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

			<v-list :loading="loading">
				<v-list-item
					v-for="translationKey in filteredTranslationKeys"
					:key="translationKey"
					class="translation-key"
					:class="{ selected: localValue && translationKey === localValueWithoutPrefix }"
					clickable
					@click="selectKey(translationKey)"
				>
					<v-list-item-icon>
						<v-icon name="translate" />
					</v-list-item-icon>
					<v-list-item-content><v-highlight :text="translationKey" :query="searchValue" /></v-list-item-content>
					<v-list-item-icon class="info">
						<custom-translations-tooltip :translation-key="translationKey" />
					</v-list-item-icon>
				</v-list-item>
				<v-list-item class="new-custom-translation" clickable @click="openNewCustomTranslationDrawer">
					<v-list-item-icon>
						<v-icon name="add" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ t('interfaces.input-translated-string.new_custom_translation') }}
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>

		<DrawerItem
			v-model:active="isCustomTranslationDrawerOpen"
			collection="directus_translations"
			primary-key="+"
			@input="create"
		/>
	</div>
</template>

<script setup lang="ts">
import type { Translation } from '@/stores/translations';
import { useTranslationsStore } from '@/stores/translations';
import { fetchAll } from '@/utils/fetch-all';
import { unexpectedError } from '@/utils/unexpected-error';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import { computed, ref, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CustomTranslationsTooltip from './custom-translations-tooltip.vue';

const translationPrefix = '$t:';

interface Props {
	value?: string | null;
	autofocus?: boolean;
	disabled?: boolean;
	placeholder?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
	value: null,
	autofocus: false,
	disabled: false,
	placeholder: null,
});

const emit = defineEmits(['input']);

const { t } = useI18n();

const menuEl = ref();
const hasValidKey = ref<boolean>(false);
const isFocused = ref<boolean>(false);
const searchValue = ref<string | null>(null);

const loading = ref(false);
const translationsKeys = ref<string[]>([]);
const translationsStore = useTranslationsStore();

const isCustomTranslationDrawerOpen = ref<boolean>(false);

const fetchTranslationsKeys = async () => {
	loading.value = true;

	try {
		const response: { key: string }[] = await fetchAll(`/translations`, {
			params: {
				fields: ['key'],
				groupBy: ['key'],
			},
		});

		translationsKeys.value = response.map((t) => t.key);
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		loading.value = false;
	}
};

fetchTranslationsKeys();

const filteredTranslationKeys = computed(() => {
	const keys = unref(translationsKeys);
	const filteredKeys = !searchValue.value ? keys : keys.filter((key) => key.includes(searchValue.value!));

	if (filteredKeys.length > 100) {
		return filteredKeys.slice(0, 100);
	}

	return filteredKeys;
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

const create = async (item: Translation) => {
	await translationsStore.create(item);
	await fetchTranslationsKeys();
};

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

function openNewCustomTranslationDrawer() {
	menuEl.value.deactivate();
	isCustomTranslationDrawerOpen.value = true;
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

.new-custom-translation {
	--v-list-item-color-hover: var(--primary-125);

	color: var(--primary);

	.v-list-item-icon {
		--v-icon-color: var(--primary);
	}
}
</style>
