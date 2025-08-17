<script setup lang="ts">
import { AUTH_SSO_DRIVERS } from '@/constants';
import { translateAPIError } from '@/lang';
import { AuthProvider } from '@/types/login';
import { getRootPath } from '@/utils/get-root-path';
import formatTitle from '@directus/format-title';
import { computed, onMounted, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const props = defineProps<{
	providers: AuthProvider[];
}>();

const { t } = useI18n();

const route = useRoute();

const { providers } = toRefs(props);
const ssoProviders = ref<{ name: string; label: string; link: string; icon: string }[]>([]);

const otp = ref<string | null>(null);
const submitting = ref(false);

const isOTPValid = computed(() => typeof otp.value === 'string' && otp.value.length === 6);

const requiresTFA = computed(() => {
	const reason = Array.isArray(route.query.reason) ? route.query.reason[0] : route.query.reason;
	return reason === 'INVALID_OTP';
});

function navigate(link: string) {
	window.location.href = link;
}

const otpAttempted = ref(false);

// Check if a previous OTP attempt was made (to conditionally show the inline error)
onMounted(() => {
	const attempted = sessionStorage.getItem('oauth_otp_attempted');

	if (attempted === '1') {
		otpAttempted.value = true;
		sessionStorage.removeItem('oauth_otp_attempted');
	}
});

const otpInlineError = computed(() => {
	const reason = Array.isArray(route.query.reason) ? route.query.reason[0] : route.query.reason;
	return reason === 'INVALID_OTP' && otpAttempted.value ? translateAPIError('INVALID_OTP') : null;
});

const selectedProviderName = ref<string | null>(null);

// List of providers for the selector when multiple SSO providers are available
const providerItems = computed(() => {
	return ssoProviders.value.map((p) => ({ text: p.label, value: p.name }));
});

const selectedProviderLink = computed(() => {
	const found = ssoProviders.value.find((p) => p.name === selectedProviderName.value);
	return found ? found.link : null;
});

watch(
	[providers, otp],
	() => {
		ssoProviders.value = providers.value
			.filter((provider) => AUTH_SSO_DRIVERS.includes(provider.driver))
			.map((provider) => {
				const ssoLoginLink = new URL(window.location.origin);
				ssoLoginLink.pathname = `${getRootPath()}auth/login/${provider.name}`;

				const redirectToLink = new URL(window.location.href);
				redirectToLink.searchParams.set('continue', '');

				ssoLoginLink.searchParams.set('redirect', redirectToLink.toString());

				if (otp.value) {
					ssoLoginLink.searchParams.set('otp', otp.value);
				}

				return {
					name: provider.name,
					label: provider.label || formatTitle(provider.name),
					link: ssoLoginLink.toString(),
					icon: provider.icon ?? 'account_circle',
				};
			});

		// Initialize selected provider from localStorage or default to first
		const lastUsed = localStorage.getItem('last_sso_provider');
		const exists = ssoProviders.value.some((p) => p.name === lastUsed);

		if (exists) {
			selectedProviderName.value = lastUsed as string;
		} else if (ssoProviders.value.length > 0) {
			const first = ssoProviders.value[0];
			selectedProviderName.value = first ? first.name : null;
		} else {
			selectedProviderName.value = null;
		}
	},
	{ immediate: true },
);

const errorFormatted = computed(() => {
	const validReasons = ['SIGN_OUT', 'SESSION_EXPIRED'];

	const reason = Array.isArray(route.query.reason) ? route.query.reason[0] : route.query.reason;

	// When requiring TFA, don't show the error banner; render the OTP input instead
	if (requiresTFA.value) return null;

	if (reason && !validReasons.includes(reason)) {
		return translateAPIError(reason);
	}

	return null;
});

function onSubmitOTP() {
	if (submitting.value) return;
	if (!isOTPValid.value) return;
	const first = ssoProviders.value[0];
	const fallback = first ? first.link : null;
	const link = selectedProviderLink.value ?? fallback;
	if (!link) return;
	submitting.value = true;
	sessionStorage.setItem('oauth_otp_attempted', '1');
	navigate(link);
}

watch(otp, (val) => {
	if (typeof val === 'string' && val.length === 6) {
		onSubmitOTP();
	}
});

watch(selectedProviderName, (val) => {
	if (val) localStorage.setItem('last_sso_provider', val);
});
</script>

<template>
	<div class="sso-links">
		<template v-if="ssoProviders.length > 0">
			<v-divider />

			<v-notice v-if="errorFormatted" type="warning">
				{{ errorFormatted }}
			</v-notice>

			<a v-for="provider in ssoProviders" :key="provider.name" class="sso-link" :href="provider.link">
				<div class="sso-icon">
					<v-icon :name="provider.icon" />
				</div>
				<div class="sso-title">
					<v-text-overflow :text="t('log_in_with', { provider: provider.label })" />
				</div>
			</a>

			<transition-expand>
				<v-input
					v-if="requiresTFA"
					v-model="otp"
					type="text"
					autocomplete="one-time-code"
					:placeholder="t('otp')"
					class="otp-input"
					@keydown.enter.prevent="onSubmitOTP"
				>
					<template #append>
						<v-progress-circular v-if="submitting" indeterminate />
					</template>
				</v-input>
			</transition-expand>

			<transition-expand>
				<div v-if="requiresTFA" class="signin-actions">
					<v-notice v-if="otpInlineError" type="warning">{{ otpInlineError }}</v-notice>

					<template v-if="ssoProviders.length > 1">
						<v-select
							v-model="selectedProviderName"
							:items="providerItems"
							:label="t('log_in_with', { provider: '' })"
							inline
						/>
					</template>
				</div>
			</transition-expand>
		</template>
	</div>
</template>

<style lang="scss" scoped>
.v-divider {
	margin: 24px 0;
}

.v-notice {
	margin-block-end: 20px;
}

.otp-input {
	margin-block-start: 12px;
}

.signin-actions {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-block-start: 12px;
}

.sso-link {
	$sso-link-border-width: 2px;

	display: flex;
	inline-size: 100%;
	block-size: var(--theme--form--field--input--height);
	background-color: var(--theme--background-normal);
	border: $sso-link-border-width var(--theme--background-normal) solid;
	border-radius: var(--theme--border-radius);
	transition: border-color var(--fast) var(--transition);

	.sso-icon {
		--v-icon-size: 28px;

		display: flex;
		align-items: center;
		justify-content: center;
		inline-size: var(--theme--form--field--input--height);
		margin: -$sso-link-border-width;
		background-color: var(--theme--background-accent);
		border-radius: var(--theme--border-radius);
	}

	.sso-title {
		display: flex;
		align-items: center;
		padding: 0 16px 0 20px;
		font-size: 16px;
		overflow: hidden;
	}

	&:hover {
		border-color: var(--theme--background-accent);
	}

	& + & {
		margin-block-start: 12px;
	}
}
</style>
