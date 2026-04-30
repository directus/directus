<script setup lang="ts">
import { KEY, normalizeKey } from '@directus/license';
import { throttle } from 'lodash';
import { ref } from 'vue';
import { I18nT, useI18n } from 'vue-i18n';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';

const { t } = useI18n();

withDefaults(
	defineProps<{
		value: string | null;
		edit?: boolean;
	}>(),
	{
		edit: false,
	},
);

const licenseInfo = ref({
	valid: true,
	plan: 'Team Plan',
	expires_on: new Date(1776996042000),
	environment: 'Production',
});

const validating = ref(false);
const stored = ref(true);
const error = ref<Error | null>(null);

const emit = defineEmits(['input']);

const validate = throttle(async (value: string | null) => {
	if (!value || value.length < 29) return;

	const parsed = KEY.safeParse(value);

	if (parsed.error) {
		error.value = parsed.error;
	} else {
		error.value = null;
	}

	validating.value = true;
	// TODO: Request status from server and update licenseInfo
	await new Promise((r) => setTimeout(r, 1000));

	validating.value = false;
}, 300);

function onUpdated(value: string | null) {
	if (value) {
		value = normalizeKey(value);
	}

	emit('input', value);

	validate(value);
}
</script>

<template>
	<div class="license-key">
		<VInput
			:model-value="value ?? undefined"
			class="license-input"
			:placeholder="$t('enter_license_key')"
			nullable
			:max-length="29"
			@update:model-value="onUpdated"
		>
			<template #append>
				<VProgressCircular v-if="validating" class="spinner" small indeterminate />
				<VIcon v-if="edit" :name="stored ? 'lock' : 'lock_open'" class="lock-icon" />
			</template>
		</VInput>

		<div v-if="licenseInfo && !error && !validating" class="validation-status">
			<div>
				<VIcon name="check_circle" />
				<span>{{ t('license_valid') }}</span>
			</div>

			<span v-if="licenseInfo.plan">
				<VIcon name="check_circle" />
				<span>{{ licenseInfo.plan }}</span>
			</span>

			<div v-if="licenseInfo.expires_on">
				<VIcon name="check_circle" />
				<span>{{ $t('expires_on') }} {{ Intl.DateTimeFormat().format(licenseInfo.expires_on) }}</span>
			</div>

			<div v-if="licenseInfo.environment">
				<VIcon name="check_circle" />
				<span>{{ $t('environment') }}: {{ licenseInfo.environment }}</span>
			</div>
		</div>

		<VNotice v-else-if="error && !validating" type="warning">
			<I18nT keypath="setup_license_invalid" tag="span">
				<template #contactSupport>
					<a :href="`https://directus.io/license-request`" target="_blank" rel="noopener noreferrer">
						{{ $t('contact_support') }}
					</a>
				</template>
			</I18nT>
		</VNotice>
	</div>
</template>

<style scoped>
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
