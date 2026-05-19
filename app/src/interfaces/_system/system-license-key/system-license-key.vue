<script setup lang="ts">
import { LICENSE_KEY, normalizeLicenseKey } from '@directus/license';
import { throttle } from 'lodash';
import { computed, onMounted, ref, watch } from 'vue';
import { I18nT, useI18n } from 'vue-i18n';
import api from '@/api';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useServerStore } from '@/stores/server';

const { t } = useI18n();
const serverStore = useServerStore();

type LicensePreview = {
	plan_name: string;
	expires_at?: number;
	renews_at?: number;
	production_enabled: boolean;
};

const props = withDefaults(
	defineProps<{
		value: string | null;
		edit?: boolean;
	}>(),
	{
		edit: false,
	},
);

const licenseInfo = ref<LicensePreview | null>(null);

const validating = ref(false);
const error = ref<'format' | 'server' | null>(null);

const isLicenseKeyMasked = ref(false);

watch(
	() => props.edit,
	(isEdit) => {
		isLicenseKeyMasked.value = isEdit;
	},
	{ immediate: true },
);

const placeholder = computed(() => (isLicenseKeyMasked.value ? t('value_securely_stored') : t('enter_license_key')));

const emit = defineEmits<{
	input: [value: string | null];
	validity: [value: { valid: boolean; validating: boolean }];
}>();

function emitValidity() {
	emit('validity', {
		valid: !!licenseInfo.value && !error.value && !validating.value,
		validating: validating.value,
	});
}

function unlock() {
	if (!isLicenseKeyMasked.value) return;
	isLicenseKeyMasked.value = false;
}

const validate = throttle(async (value: string | null) => {
	if (!value || value.length < 29) {
		licenseInfo.value = null;
		emitValidity();
		return;
	}

	const parsed = LICENSE_KEY.safeParse(value);

	if (parsed.error) {
		error.value = 'format';
		licenseInfo.value = null;
		emitValidity();
		return;
	}

	error.value = null;
	validating.value = true;
	licenseInfo.value = null;
	emitValidity();

	try {
		const response = await api.post<{ data: LicensePreview }>('/license/preview', { license_key: value });
		licenseInfo.value = response.data.data;
	} catch {
		error.value = 'server';
	} finally {
		validating.value = false;
		emitValidity();
	}
}, 300);

function onUpdated(value: string | null) {
	if (value) {
		value = normalizeLicenseKey(value);
	}

	emit('input', value);

	validate(value);
}

onMounted(() => {
	if (props.value) {
		validate(props.value);
	}
});
</script>

<template>
	<div class="license-key" :class="{ masked: isLicenseKeyMasked }">
		<VInput
			:model-value="isLicenseKeyMasked ? undefined : (value ?? undefined)"
			class="license-input"
			:placeholder="placeholder"
			nullable
			:max-length="29"
			@update:model-value="onUpdated"
			@focus="unlock"
		>
			<template #append>
				<VProgressCircular v-if="validating" class="spinner" small indeterminate />
				<VIcon
					v-else-if="edit"
					:name="isLicenseKeyMasked ? 'lock' : 'lock_open'"
					class="lock-icon"
					:clickable="isLicenseKeyMasked"
					@click="unlock"
				/>
			</template>
		</VInput>

		<div v-if="licenseInfo && !error && !validating" class="validation-status">
			<div>
				<VIcon name="check_circle" />
				<span>{{ t('license_valid') }}</span>
			</div>

			<span v-if="licenseInfo.plan_name">
				<VIcon name="check_circle" />
				<span>{{ licenseInfo.plan_name }}</span>
			</span>

			<div v-if="licenseInfo.expires_at ?? licenseInfo.renews_at">
				<VIcon name="check_circle" />
				<span>
					{{ $t('expires_on') }}
					{{ Intl.DateTimeFormat().format((licenseInfo.expires_at ?? licenseInfo.renews_at)! * 1000) }}
				</span>
			</div>

			<div>
				<VIcon name="check_circle" />
				<span>{{ $t('environment') }}: {{ licenseInfo.production_enabled ? $t('production') : $t('non_production') }}</span>
			</div>
		</div>

		<VNotice v-else-if="error === 'format' && !validating" type="warning">
			{{ $t('setup_license_invalid_format') }}
		</VNotice>

		<VNotice v-else-if="error === 'server' && !validating" type="warning">
			<I18nT keypath="setup_license_invalid" tag="span">
				<template #contactSupport>
					<a
						:href="`https://directus.io/license-request?utm_source=self_hosted&utm_medium=product&utm_campaign=2026_05_licensing&utm_term=${serverStore.info.version}&utm_content=license_key_invalid_contact_support_link`"
						target="_blank"
						rel="noopener noreferrer"
					>
						{{ $t('contact_support') }}
					</a>
				</template>
			</I18nT>
		</VNotice>
	</div>
</template>

<style scoped>
.license-key.masked {
	--v-input-placeholder-color: var(--theme--primary);

	.lock-icon {
		--v-icon-color: var(--theme--primary);
	}
}

.validation-status {
	display: grid;
	grid-template-columns: 1fr 1fr;
	margin-block-start: 0.5rem;

	& > div {
		display: flex;
	}

	.v-icon {
		margin-inline-end: 0.325rem;

		--v-icon-color: var(--theme--success);
	}
}

.v-notice {
	margin-block-start: 1.25rem;

	:deep(a) {
		color: var(--theme--primary);
		text-decoration: underline;
	}
}
</style>
