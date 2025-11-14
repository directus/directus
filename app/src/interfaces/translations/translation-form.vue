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
	nonEditable,
	relationInfo,
	getItemWithLang,
	displayItems,
	fetchedItems,
	getItemEdits,
	isLocalItem,
	remove,
	loading,
	updateValue,
} = defineProps<{
	languageOptions: Record<string, any>[];
	disabled?: boolean;
	nonEditable?: boolean;
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

const { transition, iconName, onEnableTranslation, onMousedown, onMouseup, onTransitionEnd } = useActivatorButton();

function useActivatorButton() {
	const pressing = ref(false);
	const pressed = ref(false);
	const transition = ref(false);

	const iconName = computed(() =>
		(pressed.value || pressing.value) && !activatorDisabled.value ? 'check_box' : 'check_box_outline_blank',
	);

	watch([item, lang], ([newItem, newLang], [oldItem, oldLang]) => {
		const isInitialItem = isEmpty(newItem) && isEmpty(oldItem);
		transition.value = isInitialItem ? false : newItem !== oldItem && newLang === oldLang;
	});

	return {
		transition,
		iconName,
		onEnableTranslation,
		onMousedown,
		onMouseup,
		onTransitionEnd,
	};

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

function onToggleDelete(item: DisplayItem, itemInitial?: DisplayItem) {
	if (!isEmpty(item)) {
		remove(item);
		return;
	}

	if (isEmpty(itemInitial)) return;

	remove(itemInitial);
}
</script>

<template>
	<div :class="{ secondary }">
		<language-select v-model="lang" :items="languageOptions" :danger="item?.$type === 'deleted'" :secondary>
			<template #prepend>
				<span v-if="loading" class="activator-loading-placeholder" />

				<transition
					v-else
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
						:name="iconName"
						:disabled="activatorDisabled"
						clickable
						@click.stop="onEnableTranslation(lang, item, itemInitial)"
						@mousedown="onMousedown"
						@mouseup="onMouseup"
					/>
				</transition>
			</template>

			<template #controls="{ active, toggle }">
				<v-remove
					v-if="item && !(nonEditable && item.$type !== 'deleted')"
					:class="{ disabled: activatorDisabled }"
					:disabled="activatorDisabled"
					:item-type="item.$type"
					:item-info="relationInfo"
					:item-is-local="isLocalItem(item)"
					:item-edits="getItemEdits(item)"
					@action="onToggleDelete(item, itemInitial)"
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
			:non-editable
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
.activator-loading-placeholder {
	--size: 24px;

	display: inline-block;
	inline-size: var(--size);
	block-size: var(--size);
}

.v-icon.disabled {
	--v-icon-color: var(--theme--primary-subdued);
}

.v-form {
	--theme--form--row-gap: 32px;
	--v-chip-color: var(--theme--primary);
	--v-chip-background-color: var(--theme--primary-background);

	margin-block-start: 32px;

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
	margin-block-start: var(--theme--form--row-gap);
}

.secondary {
	.v-icon.disabled {
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
