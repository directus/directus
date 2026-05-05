<script setup lang="ts">
import type { Field } from '@directus/types';
import { useElementHover } from '@vueuse/core';
import { isEmpty } from 'lodash';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
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

const translateBtn = useTemplateRef<HTMLButtonElement>('translateBtn');
const formWrapper = useTemplateRef<HTMLDivElement>('formWrapper');
const isHoveringTranslateButton = useElementHover(translateBtn);

// Unmount the form when fields or lang change to avoid WYSIWYG crashing while Vue manipulates the DOM.
const formReady = ref(true);

watch([fields, lang], async () => {
	formReady.value = false;
	await nextTick();
	formReady.value = true;
});

const activatorDisabled = computed(() => {
	return (
		disabled || (!item.value && !saveAllowed.value) || (item.value && !deleteAllowed.value && !isLocalItem(item.value))
	);
});

const activeTranslationField = computed(() => translationJob?.getActiveField(lang.value) ?? null);

const queuedTranslationFields = computed(() => translationJob?.getQueuedFields(lang.value) ?? []);

const lockedTranslationFields = computed(() => {
	const locked = new Set<string>();

	if (activeTranslationField.value) {
		locked.add(activeTranslationField.value);
	}

	for (const fieldName of queuedTranslationFields.value) {
		locked.add(fieldName);
	}

	return locked;
});

const formFields = computed<Field[]>(() =>
	fields.value.map((field) => {
		if (!lockedTranslationFields.value.has(field.field)) return field as Field;

		return {
			...field,
			meta: {
				...field.meta,
				readonly: true,
			},
		} as Field;
	}),
);

watch(
	[item, selectedLanguage, activeTranslationField, queuedTranslationFields],
	() => {
		void nextTick().then(syncFieldTranslationState);
	},
	{ immediate: true },
);

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

function syncFieldTranslationState() {
	const formEl = formWrapper.value;

	if (!formEl) return;

	const fieldEls = formEl.querySelectorAll<HTMLElement>('.field[data-field]');
	const activeField = activeTranslationField.value;
	const queuedFields = new Set(queuedTranslationFields.value);

	for (const fieldEl of fieldEls) {
		const fieldName = fieldEl.dataset.field;
		const isActive = fieldName !== undefined && fieldName === activeField;
		const isQueued = fieldName !== undefined && queuedFields.has(fieldName);

		let translationState = 'idle';

		if (isActive) {
			translationState = 'active';
		} else if (isQueued) {
			translationState = 'queued';
		}

		fieldEl.dataset.translationState = translationState;

		const surfaceEl = getTranslationSurface(fieldEl);

		surfaceEl.classList.toggle('translation-field-active', isActive);
		surfaceEl.classList.toggle('translation-field-queued', isQueued);
	}
}

function getTranslationSurface(fieldEl: HTMLElement): HTMLElement {
	for (const selector of [
		'.interface .v-input .input',
		'.interface .v-textarea',
		'.interface .wysiwyg',
		'.interface .interface-input-rich-text-md',
		'.interface .input-block-editor .editor',
		'.interface .system-raw-editor',
		'.interface > *:not(.v-notice)',
	]) {
		const surface = fieldEl.querySelector<HTMLElement>(selector);
		if (surface) return surface;
	}

	return fieldEl;
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
					:name="transition ? (item ? 'rotate-in' : 'rotate-out') : undefined"
					:duration="transition ? undefined : 0"
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
					type="button"
					class="header-translate-btn translating"
					@click.stop="
						if (active) toggle();
						emit('openTranslateDrawer');
					"
				>
					<AiMagicButton animate class="header-sparkle" />
					<span>{{ $t('interfaces.translations.ai_translating') }}</span>
				</button>

				<button
					v-else-if="showAiTranslate"
					ref="translateBtn"
					type="button"
					class="header-translate-btn"
					@click.stop="
						if (active) toggle();
						emit('openTranslateDrawer');
					"
				>
					<AiMagicButton :animate="isHoveringTranslateButton" class="header-sparkle" />
					<span v-tooltip="$t('interfaces.translations.ai_translate_tooltip')">
						{{ $t('interfaces.translations.ai_translate_short') }}
					</span>
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

		<div
			v-if="selectedLanguage"
			ref="formWrapper"
			class="form-wrapper"
			:class="{ 'is-translating': isTranslatingLanguage }"
		>
			<VForm
				v-if="formReady"
				:key="selectedLanguage.value"
				:primary-key="itemPrimaryKey ?? '+'"
				:class="{ unselected: !item, disabled }"
				:disabled="disabled || !saveAllowed || item?.$type === 'deleted'"
				:non-editable
				:loading="loading"
				:fields="formFields"
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
@property --translation-shimmer-hue {
	syntax: '<number>';
	inherits: true;
	initial-value: 20;
}

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

:deep(.translation-field-queued) {
	border-radius: var(--theme--border-radius);
	background: color-mix(in srgb, var(--theme--primary) 5%, var(--theme--form--field--input--background));
	box-shadow:
		0 0 0 0.1875rem color-mix(in srgb, var(--theme--primary) 10%, transparent),
		var(--theme--form--field--input--box-shadow);
	transition:
		background-color var(--medium) var(--transition),
		box-shadow var(--medium) var(--transition);
}

:deep(.translation-field-active) {
	--translation-shimmer-duration: 2.3s;
	--translation-hue-duration: 2.2s;
	--translation-shimmer-hue: 20;
	--translation-shimmer-base: color-mix(
		in srgb,
		var(--theme--form--field--input--background) 82%,
		var(--theme--background-normal) 18%
	);
	--translation-shimmer-ring: oklch(84% 0.1 var(--translation-shimmer-hue) / 0.24);
	--translation-shimmer-glow: oklch(86% 0.14 var(--translation-shimmer-hue) / 0.18);
	position: relative;
	border: none !important;
	outline: none;
	border-radius: var(--theme--border-radius);
	background: var(--translation-shimmer-base);
	overflow: hidden;
	isolation: isolate;
	box-shadow:
		0 0 0 0.1875rem var(--translation-shimmer-ring),
		0 0 1rem var(--translation-shimmer-glow);
	animation: shimmer-hue var(--translation-hue-duration) linear infinite;
	will-change: box-shadow;

	&::after {
		content: '';
		position: absolute;
		inset-block: -24%;
		inset-inline-start: -68%;
		inline-size: 62%;
		border-radius: 999px;
		background: linear-gradient(
			124deg,
			transparent 0%,
			oklch(88% 0.03 var(--translation-shimmer-hue) / 0) 16%,
			oklch(87% 0.12 var(--translation-shimmer-hue) / 0.18) 28%,
			oklch(88% 0.15 var(--translation-shimmer-hue) / 0.48) 50%,
			oklch(87% 0.12 var(--translation-shimmer-hue) / 0.18) 72%,
			oklch(88% 0.03 var(--translation-shimmer-hue) / 0) 84%,
			transparent 100%
		);
		filter: blur(0.75rem);
		opacity: 0;
		animation: shimmer-surface var(--translation-shimmer-duration) linear infinite;
		will-change: transform, opacity;
		pointer-events: none;
	}
}

@keyframes shimmer-surface {
	0% {
		transform: translate3d(0, 0, 0);
		opacity: 0;
	}

	12% {
		opacity: 1;
	}

	88% {
		opacity: 1;
	}

	100% {
		transform: translate3d(320%, 0, 0);
		opacity: 0;
	}
}

@keyframes shimmer-hue {
	0% {
		--translation-shimmer-hue: 20;
	}

	100% {
		--translation-shimmer-hue: 380;
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

	&:focus-visible {
		outline: var(--focus-ring-width) solid var(--theme--primary);
		outline-offset: var(--focus-ring-offset);
		border-radius: var(--theme--border-radius);
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

	:deep(.translation-field-queued) {
		background: color-mix(in srgb, var(--theme--secondary) 6%, var(--theme--form--field--input--background));
		box-shadow:
			0 0 0 0.1875rem color-mix(in srgb, var(--theme--secondary) 12%, transparent),
			var(--theme--form--field--input--box-shadow);
	}

	:deep(.translation-field-active) {
		box-shadow:
			0 0 0 0.1875rem var(--translation-shimmer-ring),
			0 0 1rem var(--translation-shimmer-glow),
			var(--theme--form--field--input--box-shadow-focus);
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
