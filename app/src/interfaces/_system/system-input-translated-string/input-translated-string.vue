<script setup lang="ts">
import { snakeCase } from 'lodash';
import { computed, ref, unref, watch } from 'vue';
import CustomTranslationsTooltip from './custom-translations-tooltip.vue';
import VHighlight from '@/components/v-highlight.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import type { Translation } from '@/stores/translations';
import { useTranslationsStore } from '@/stores/translations';
import { useUserStore } from '@/stores/user';
import { fetchAll } from '@/utils/fetch-all';
import { unexpectedError } from '@/utils/unexpected-error';
import DrawerItem from '@/views/private/components/drawer-item.vue';

const translationPrefix = '$t:';

const props = withDefaults(
	defineProps<{
		value?: string | null;
		autofocus?: boolean;
		disabled?: boolean;
		placeholder?: string | null;
	}>(),
	{
		value: null,
		placeholder: null,
	},
);

const emit = defineEmits(['input']);

const menuEl = ref();
const hasValidKey = ref<boolean>(false);
const isFocused = ref<boolean>(false);
const searchValue = ref<string | null>(null);

const loading = ref(false);
const translationsKeys = ref<string[]>([]);
const translationsStore = useTranslationsStore();

const isCustomTranslationDrawerOpen = ref<boolean>(false);

const userStore = useUserStore();

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
	} catch (error) {
		unexpectedError(error);
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
	setValue(`${translationPrefix}${item.key}`);
};

watch(
	() => props.value,
	(newVal) => setValue(newVal),
	{ immediate: true },
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

const newTranslationDefaults = computed(() => {
	const defaults = {
		language: userStore.language,
	};

	if (localValue.value && !localValue.value.startsWith(translationPrefix)) {
		Object.assign(defaults, {
			key: snakeCase(localValue.value),
			value: localValue.value,
		});
	}

	return defaults;
});
</script>

<template>
	<div class="input-translated-string">
		<VMenu ref="menuEl" :disabled="disabled" :close-on-content-click="false" attached>
			<template #activator="{ toggle, active }">
				<VInput
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
						<button class="selected-translation" :disabled="disabled" @click.stop="setValue(null)">
							{{ value && getKeyWithoutPrefix(value) }}
						</button>
					</template>
					<template #append>
						<VIcon
							name="translate"
							class="translate-icon"
							:class="{ active }"
							clickable
							:disabled="disabled"
							@click="toggle"
						/>
					</template>
				</VInput>
			</template>

			<div v-if="searchValue !== null || filteredTranslationKeys.length >= 25" class="search">
				<VInput
					class="search-input"
					type="text"
					:model-value="searchValue"
					autofocus
					:placeholder="$t('interfaces.input-translated-string.search_placeholder')"
					@update:model-value="searchValue = $event"
				>
					<template #append>
						<VIcon name="search" class="search-icon" />
					</template>
				</VInput>
			</div>

			<VList :loading="loading">
				<VListItem
					v-for="translationKey in filteredTranslationKeys"
					:key="translationKey"
					class="translation-key"
					:class="{ selected: localValue && translationKey === localValueWithoutPrefix }"
					clickable
					@click="selectKey(translationKey)"
				>
					<VListItemIcon>
						<VIcon name="translate" />
					</VListItemIcon>
					<VListItemContent><VHighlight :text="translationKey" :query="searchValue" /></VListItemContent>
					<VListItemIcon class="info">
						<CustomTranslationsTooltip :translation-key="translationKey" />
					</VListItemIcon>
				</VListItem>
				<VListItem class="new-custom-translation" clickable @click="openNewCustomTranslationDrawer">
					<VListItemIcon>
						<VIcon name="add" />
					</VListItemIcon>
					<VListItemContent>
						{{ $t('interfaces.input-translated-string.new_custom_translation') }}
					</VListItemContent>
				</VListItem>
			</VList>
		</VMenu>

		<DrawerItem
			v-model:active="isCustomTranslationDrawerOpen"
			collection="directus_translations"
			primary-key="+"
			:edits="newTranslationDefaults"
			@input="create"
		/>
	</div>
</template>

<style lang="scss" scoped>
.translation-input {
	.selected-translation {
		margin-inline-end: auto;
		padding: 2px 8px 0;
		color: var(--theme--primary);
		background-color: var(--theme--primary-background);
		border-radius: var(--theme--border-radius);
		transition: var(--fast) var(--transition);
		transition-property: background-color, color;
		font-family: var(--theme--fonts--monospace--font-family);
		overflow-x: hidden;
	}

	.selected-translation:not(:disabled):hover {
		color: var(--white);
		background-color: var(--theme--danger);
	}

	.translate-icon {
		&:hover,
		&.active {
			--v-icon-color-hover: var(--theme--primary);
			--v-icon-color: var(--theme--primary);
		}
	}
}

.search {
	padding: 12px 8px 6px;

	.search-input {
		--input-height: 40px;
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

	.info :deep(.icon:focus-visible),
	&:focus-visible .info :deep(.icon),
	&:hover .info :deep(.icon) {
		opacity: 1;
	}

	:deep(mark) {
		flex: 0 1 auto;
		color: var(--theme--primary);
	}

	&.selected {
		--v-list-item-color-active: var(--foreground-inverted);
		--v-list-item-background-color-active: var(--theme--primary);
		--v-list-item-color-hover: var(--foreground-inverted);
		--v-list-item-background-color-hover: var(--theme--primary);
		--focus-ring-color: var(--v-list-item-color-active);
		--focus-ring-offset: var(--focus-ring-offset-inset);

		background-color: var(--theme--primary);
		color: var(--foreground-inverted);

		.v-list-item-icon {
			--v-icon-color: var(--foreground-inverted);
			--focus-ring-offset: var(--focus-ring-offset-invert);
		}

		.info :deep(.icon) {
			color: var(--foreground-inverted);
			opacity: 1;
		}
	}
}

.new-custom-translation {
	--v-list-item-color-hover: var(--theme--primary-accent);

	color: var(--theme--primary);

	.v-list-item-icon {
		--v-icon-color: var(--theme--primary);
	}
}
</style>
