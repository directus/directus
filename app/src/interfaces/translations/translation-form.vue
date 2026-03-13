<script setup lang="ts">
import { isEmpty } from 'lodash';
import { computed, ref, watch } from 'vue';
import LanguageSelect from './language-select.vue';
import type { TranslationJob } from './use-translation-job';
import AiMagicButton from '@/ai/components/ai-magic-button.vue';
import VDivider from '@/components/v-divider.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VRemove from '@/components/v-remove.vue';
import { usePermissions } from '@/composables/use-permissions';
import { type RelationM2M } from '@/composables/use-relation-m2m';
import { type DisplayItem } from '@/composables/use-relation-multiple';
import vTooltip from '@/directives/tooltip';

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
	translationJob,
	showAiTranslate,
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
	translationJob?: TranslationJob;
	showAiTranslate?: boolean;
	keepLanguageMenuBehind?: boolean;
}>();

const emit = defineEmits<{
	openTranslateDrawer: [];
}>();

const lang = defineModel<string>('lang');

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

const isTranslatingLanguage = computed(() => {
	if (!lang.value || !translationJob) return false;
	return translationJob.pendingLanguages.value.has(lang.value);
});

const isHoveringTranslateButton = ref(false);

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
		<LanguageSelect
			v-model="lang"
			:items="languageOptions"
			:danger="item?.$type === 'deleted'"
			:secondary
			:disabled="disabled"
			:non-editable
			:keep-behind="keepLanguageMenuBehind"
		>
			<template #prepend>
				<span v-if="loading" class="activator-loading-placeholder" />

				<Transition
					v-else
					:name="transition ? (item ? 'rotate-in' : 'rotate-out') : null"
					:duration="transition ? null : 0"
					mode="out-in"
					@after-leave="onTransitionEnd"
					@leave-cancelled="onTransitionEnd"
				>
					<VIcon v-if="item || nonEditable" name="translate" :disabled="activatorDisabled" />

					<VIcon
						v-else
						v-tooltip="!activatorDisabled ? $t('enable') : null"
						:class="{ disabled: activatorDisabled }"
						:name="iconName"
						:disabled="activatorDisabled"
						clickable
						@click.stop="onEnableTranslation(lang, item, itemInitial)"
						@mousedown="onMousedown"
						@mouseup="onMouseup"
					/>
				</Transition>
			</template>

			<template #controls="{ active, toggle }">
				<button
					v-if="isTranslatingLanguage"
					class="header-translate-btn translating"
					@click.stop="emit('openTranslateDrawer')"
				>
					<AiMagicButton animate class="header-sparkle" />
					<span>{{ $t('interfaces.translations.ai_translating') }}</span>
				</button>

				<button
					v-else-if="showAiTranslate"
					v-tooltip="$t('interfaces.translations.ai_translate_tooltip')"
					class="header-translate-btn"
					@click.stop="emit('openTranslateDrawer')"
					@mouseenter="isHoveringTranslateButton = true"
					@mouseleave="isHoveringTranslateButton = false"
				>
					<AiMagicButton :animate="isHoveringTranslateButton" class="header-sparkle" />
					<span>{{ $t('interfaces.translations.ai_translate_short') }}</span>
				</button>

				<VRemove
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
		</LanguageSelect>

		<div v-if="selectedLanguage" class="form-wrapper" :class="{ 'is-translating': isTranslatingLanguage }">
			<VForm
				:key="selectedLanguage.value"
				:primary-key="itemPrimaryKey ?? '+'"
				:class="{ unselected: !item, disabled }"
				:disabled="disabled || !saveAllowed || item?.$type === 'deleted' || isTranslatingLanguage"
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
		</div>

		<VDivider />
	</div>
</template>

<style lang="scss" scoped>
.activator-loading-placeholder {
	--size: 1.375rem;

	display: inline-block;
	inline-size: var(--size);
	block-size: var(--size);
}

.v-icon.disabled {
	--v-icon-color: var(--theme--primary-subdued);
}

.form-wrapper {
	margin-block-start: 1.8125rem;
}

.form-wrapper.is-translating :deep(.v-form) {
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent 25%,
			color-mix(in srgb, var(--theme--primary) 5%, transparent) 50%,
			transparent 75%
		);
		background-size: 200% 100%;
		animation: shimmer 2.5s ease-in-out infinite;
		pointer-events: none;
		z-index: 1;
	}
}

@keyframes shimmer {
	0% {
		background-position: 200% 0;
	}

	100% {
		background-position: -200% 0;
	}
}

.header-translate-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	background: none;
	border: none;
	cursor: pointer;
	font-size: 0.875rem;
	color: var(--theme--primary);
	padding: 0;
	white-space: nowrap;
	text-decoration: none;
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--primary-accent);
	}
}

.header-sparkle {
	inline-size: 1.25rem;
	block-size: 1.25rem;
}

.v-form {
	--theme--form--row-gap: 1.8125rem;
	--v-chip-color: var(--theme--primary);
	--v-chip-background-color: var(--theme--primary-background);

	&.unselected:not(.disabled) {
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

	.header-translate-btn {
		color: var(--theme--secondary);

		&:hover {
			color: var(--theme--secondary-accent);
		}
	}

	.form-wrapper.is-translating :deep(.v-form)::before {
		background: linear-gradient(
			90deg,
			transparent 25%,
			color-mix(in srgb, var(--theme--secondary) 5%, transparent) 50%,
			transparent 75%
		);
		background-size: 200% 100%;
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
