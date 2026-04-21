<script setup lang="ts">
import { watchDebounced } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { I18nT, useI18n } from 'vue-i18n';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useLicensePreview } from '@/composables/use-license-preview';

const { t } = useI18n();

const props = withDefaults(
	defineProps<{
		utmTerm?: string;
		utmContent?: string;
		variant?: 'setup' | 'drawer';
		hasStoredValue?: boolean;
	}>(),
	{
		utmTerm: '',
		utmContent: '',
		variant: 'setup',
		hasStoredValue: false,
	},
);

const emit = defineEmits<{
	'can-submit-change': [value: boolean];
}>();

const modelValue = defineModel<string | null>({ default: null });
const inputValue = ref<string | undefined>(modelValue.value ?? undefined);
const hasEditedStoredValue = ref(false);

const { previewPayload, validating, validationError, fetchPreview, clearPreview } = useLicensePreview();

watch(modelValue, (value) => {
	inputValue.value = value ?? undefined;

	if (!value) {
		clearPreview();
	}
});

watchDebounced(
	inputValue,
	async (value) => {
		const normalized = value?.trim() || null;

		if (normalized !== modelValue.value) {
			modelValue.value = normalized;
		}

		if (normalized) {
			await fetchPreview(normalized);
		} else {
			clearPreview();
		}
	},
	{ debounce: 400 },
);

const planName = computed(() => previewPayload.value?.plan?.name ?? null);

const showStoredPlaceholder = computed(() => {
	return props.hasStoredValue && !hasEditedStoredValue.value;
});

const placeholderText = computed(() => {
	if (showStoredPlaceholder.value) return t('license.value_securely_stored');
	return t('license_key_placeholder');
});

const invalidMessage = computed(() => {
	if (validationError.value) return validationError.value;
	if (previewPayload.value && previewPayload.value.valid === false) return t('license_invalid');
	return null;
});

const canSubmit = computed(() => {
	if (!modelValue.value?.trim()) return false;
	if (validating.value) return false;
	if (validationError.value) return false;
	return previewPayload.value?.valid === true;
});

watch(
	canSubmit,
	(value) => {
		emit('can-submit-change', value);
	},
	{ immediate: true },
);

function updateInputValue(value: string | number | null) {
	if (typeof value === 'string') {
		inputValue.value = value;
	} else if (value === null) {
		inputValue.value = undefined;
	} else {
		inputValue.value = String(value);
	}

	if (props.hasStoredValue) {
		hasEditedStoredValue.value = true;
	}
}
</script>

<template>
	<div class="license-key-input">
		<VNotice class="license-notice">
			<I18nT v-if="variant === 'setup'" keypath="setup_license_key_notice" tag="span">
				<template #learnMore>
					<a
						:href="`https://directus.io/license-request?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_10_kyc&utm_term=${utmTerm}&utm_content=${utmContent}_learn_more_link`"
						target="_blank"
					>
						{{ t('setup_learn_more') }}
					</a>
				</template>
			</I18nT>

			<I18nT v-else keypath="license.manage_license_notice" tag="span">
				<template #openInnovationGrant>
					<a
						:href="`https://directus.io/license-request?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_10_kyc&utm_term=${utmTerm}&utm_content=${utmContent}_open_innovation_grant_link`"
						target="_blank"
					>
						{{ t('license.open_innovation_grant') }}
					</a>
				</template>
			</I18nT>
		</VNotice>

		<div class="license-field">
			<label class="license-label type-label">
				{{ t('license_key') }}
				<span v-if="variant === 'setup'" class="optional">({{ t('setup_optional') }})</span>
			</label>

			<VInput
				:model-value="inputValue"
				class="license-input"
				:class="{ 'stored-placeholder': showStoredPlaceholder }"
				:placeholder="placeholderText"
				nullable
				@update:model-value="updateInputValue"
			>
				<template v-if="validating" #append>
					<VProgressCircular class="spinner" small indeterminate />
					<VIcon :name="showStoredPlaceholder ? 'lock' : 'lock_open'" class="lock-icon" />
				</template>

				<template v-else #append>
					<VIcon :name="showStoredPlaceholder ? 'lock' : 'lock_open'" class="lock-icon" />
				</template>
			</VInput>

			<div v-if="invalidMessage" class="validation-status">
				<span class="status-item status-invalid">
					<VIcon name="cancel" class="status-icon status-icon--error" />
					{{ invalidMessage }}
				</span>
			</div>

			<div v-else-if="previewPayload?.valid" class="validation-status">
				<span class="status-item">
					<VIcon name="check_circle" class="status-icon" />
					{{ t('license_valid') }}
				</span>

				<span v-if="planName" class="status-item">
					<VIcon name="check_circle" class="status-icon" />
					{{ planName }}
				</span>
			</div>
		</div>
	</div>
</template>

<style scoped>
.license-key-input {
	display: grid;
}

.license-notice {
	margin-block-end: 2rem;

	:deep(a) {
		color: var(--theme--primary);
		text-decoration: underline;
	}
}

.license-field {
	display: grid;
	gap: 0.5rem;
}

.type-label {
	margin-block-end: 0.4375rem;
	font-size: 0.875rem;
	font-weight: 600;

	.optional {
		color: var(--theme--primary);
		font-weight: 400;
		margin-inline-start: 0.25rem;
	}
}

.license-input {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
	--v-icon-color: var(--theme--warning);

	&.stored-placeholder {
		--v-input-placeholder-color: var(--theme--primary);
		--v-icon-color: var(--theme--primary);
	}
}

.validation-status {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.25rem 1.5rem;
	margin-block-start: 0.25rem;
}

.spinner {
	--v-progress-circular-color: var(--theme--foreground-subdued);
	margin-inline-end: 0.375rem;
}

.lock-icon {
	--v-icon-color: var(--theme--warning);
	margin-inline-end: 0.5rem;

	.license-input.stored-placeholder & {
		--v-icon-color: var(--theme--primary);
	}
}

.status-item {
	display: flex;
	align-items: center;
	gap: 0.375rem;
	font-size: 0.8125rem;
	color: var(--theme--success);

	&.status-invalid {
		color: var(--theme--danger);
	}
}

.status-icon {
	--v-icon-size: 1rem;
	--v-icon-color: var(--theme--success);

	&--error {
		--v-icon-color: var(--theme--danger);
	}
}

@media (width <= 40rem) {
	.validation-status {
		grid-template-columns: minmax(0, 1fr);
	}
}
</style>
