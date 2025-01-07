<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { isEmpty } from 'lodash';
import { usePermissions } from '@/composables/use-permissions';
import { type DisplayItem } from '@/composables/use-relation-multiple';
import { type RelationM2M } from '@/composables/use-relation-m2m';
import LanguageSelect from './language-select.vue';

const {
	languageOptions,
	disabled,
	relationInfo,
	getItemWithLang,
	displayItems,
	fetchedItems,
	getItemEdits,
	isLocalItem,
	remove,
	updateValue,
} = defineProps<{
	languageOptions: Record<string, any>[];
	disabled?: boolean;
	autofocus?: boolean;
	relationInfo?: RelationM2M;
	getItemWithLang: (items: Record<string, any>[], lang: string | undefined) => DisplayItem | undefined;
	loading?: boolean;
	displayItems: DisplayItem[];
	fetchedItems: Record<string, any>[];
	getItemEdits: (item: DisplayItem) => DisplayItem;
	isLocalItem: (item: DisplayItem) => boolean;
	remove: (...items: DisplayItem[]) => void;
	updateValue: (item: DisplayItem | undefined, lang: string | undefined) => void;
	secondary?: boolean;
}>();

const lang = defineModel<string>('lang');

const { t } = useI18n();

const selectedLanguage = computed(() => languageOptions.find((optLang) => lang.value === optLang.value));

const item = computed(() => {
	const item = getItemWithLang(displayItems, lang.value);
	if (item === undefined) return undefined;

	const itemEdits = getItemEdits(item);

	if (isEmpty(itemEdits) && item.$type === 'deleted') return item;

	return itemEdits;
});

const itemInitial = computed(() => getItemWithLang(fetchedItems, lang.value));

const itemPrimaryKey = computed(() => relationInfo && itemInitial.value?.[relationInfo.junctionPrimaryKeyField.field]);

const itemNew = computed(() => !!(relationInfo && itemPrimaryKey.value === undefined));

const {
	itemPermissions: { saveAllowed, fields, deleteAllowed },
} = usePermissions(
	computed(() => relationInfo?.junctionCollection.collection ?? null),
	itemPrimaryKey,
	itemNew,
);

const activatorDisabled = computed(() => {
	return (
		disabled || (!item.value && !saveAllowed.value) || (item.value && !deleteAllowed.value && !isLocalItem(item.value))
	);
});

const { getIconName, onEnableTranslation, onMousedown, onMouseup, onTransitionEnd, transition } = useActivatorButton();
const { getDeleteToggleTooltip, getDeleteToggleName, onToggleDelete } = useDeleteToggle();

function useActivatorButton() {
	const pressing = ref(false);
	const pressed = ref(false);
	const transition = ref(false);

	watch([item, lang], ([newItem, newLang], [oldItem, oldLang]) => {
		transition.value = newItem !== oldItem && newLang === oldLang;
	});

	return {
		getIconName,
		onEnableTranslation,
		onMousedown,
		onMouseup,
		onTransitionEnd,
		transition,
	};

	function getIconName() {
		if ((pressed.value || pressing.value) && !activatorDisabled.value) return 'check_box';
		return 'check_box_outline_blank';
	}

	function onEnableTranslation(lang?: string, item?: DisplayItem, itemInitial?: DisplayItem) {
		if (!isEmpty(item) || !isEmpty(itemInitial)) return;
		updateValue(item, lang);
	}

	function onMousedown() {
		pressing.value = true;
		document.addEventListener('mouseup', onMouseupOutside);
	}

	function onMouseupOutside() {
		pressing.value = false;
		document.removeEventListener('mouseup', onMouseupOutside);
	}

	function onMouseup() {
		pressed.value = true;
	}

	function onTransitionEnd() {
		pressed.value = false;
	}
}

function useDeleteToggle() {
	return {
		getDeleteToggleTooltip,
		getDeleteToggleName,
		onToggleDelete,
	};

	function getDeleteToggleTooltip(item: DisplayItem) {
		if (item.$type === 'deleted') return 'undo_removed_item';
		if (isLocalItem(item)) return 'delete_item';
		return 'remove_item';
	}

	function getDeleteToggleName(item?: DisplayItem) {
		if (item?.$type === 'deleted') return 'settings_backup_restore';
		return 'delete';
	}

	function onToggleDelete(item: DisplayItem, itemInitial?: DisplayItem) {
		if (!isEmpty(item)) {
			remove(item);
			return;
		}

		if (isEmpty(itemInitial)) return;

		remove(itemInitial);
	}
}
</script>

<template>
	<div :class="{ secondary }">
		<language-select v-model="lang" :items="languageOptions" :danger="item?.$type === 'deleted'" :secondary>
			<template #prepend>
				<transition
					:name="transition ? (item ? 'rotate-in' : 'rotate-out') : null"
					:duration="transition ? null : 0"
					mode="out-in"
					@after-leave="onTransitionEnd"
					@leave-cancelled="onTransitionEnd"
				>
					<v-icon v-if="item" name="translate" :disabled="activatorDisabled" />

					<v-icon
						v-else
						v-tooltip="!activatorDisabled ? t('enable') : null"
						:class="{ disabled: activatorDisabled }"
						:name="getIconName()"
						:disabled="activatorDisabled"
						clickable
						@click.stop="onEnableTranslation(lang, item, itemInitial)"
						@mousedown="onMousedown"
						@mouseup="onMouseup"
					/>
				</transition>
			</template>

			<template #controls="{ active, toggle }">
				<v-icon
					v-if="item"
					v-tooltip="!activatorDisabled ? t(getDeleteToggleTooltip(item)) : null"
					class="delete"
					:class="{ disabled: activatorDisabled }"
					:disabled="activatorDisabled"
					:name="getDeleteToggleName(item)"
					clickable
					@click.stop="onToggleDelete(item, itemInitial)"
				/>

				<slot name="split-view" :active :toggle />
			</template>
		</language-select>

		<v-form
			v-if="selectedLanguage"
			:key="selectedLanguage.value"
			:primary-key="
				relationInfo?.junctionPrimaryKeyField.field ? itemInitial?.[relationInfo?.junctionPrimaryKeyField.field] : null
			"
			:class="{ unselected: !item }"
			:disabled="disabled || !saveAllowed || item?.$type === 'deleted'"
			:loading="loading"
			:fields="fields"
			:model-value="item"
			:initial-values="itemInitial"
			:badge="selectedLanguage.text"
			:direction="selectedLanguage.direction"
			:autofocus="autofocus"
			inline
			@update:model-value="updateValue($event, lang)"
		/>

		<v-divider />
	</div>
</template>

<style lang="scss" scoped>
.disabled {
	--v-icon-color: var(--theme--primary-subdued);
}

.v-form {
	--theme--form--row-gap: 32px;
	--v-chip-color: var(--theme--primary);
	--v-chip-background-color: var(--theme--primary-background);

	margin-top: 32px;

	&.unselected {
		opacity: 0.5;

		&:hover,
		&:focus-within {
			opacity: 1;
		}
	}
}

.v-divider {
	--v-divider-color: var(--theme--primary-subdued);
	margin-top: var(--theme--form--row-gap);
}

.secondary {
	.disabled {
		--v-icon-color: var(--theme--secondary-subdued);
	}

	.v-form {
		--primary: var(--theme--secondary);
		--v-chip-color: var(--theme--secondary);
		--v-chip-background-color: var(--secondary-alt);
	}

	.v-divider {
		--v-divider-color: var(--secondary-50);
	}
}

.delete:hover {
	--v-icon-color-hover: var(--theme--danger);
}

.rotate {
	&-in,
	&-out {
		&-enter-active,
		&-enter-active.has-click {
			transition: transform var(--medium) var(--transition-in);
		}
		&-leave-active,
		&-leave-active.has-click {
			transition: transform var(--medium) var(--transition-out);
		}

		&-leave-from,
		&-enter-to {
			transform: rotate(0deg);
		}
	}

	&-in-enter-from,
	&-out-leave-to {
		transform: rotate(90deg);
	}
	&-in-leave-to,
	&-out-enter-from {
		transform: rotate(-90deg);
	}
}
</style>
