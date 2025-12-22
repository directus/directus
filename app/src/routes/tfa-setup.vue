<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VError from '@/components/v-error.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useTFASetup } from '@/composables/use-tfa-setup';
import { DEFAULT_AUTH_DRIVER } from '@/constants';
import { router } from '@/router';
import { useUserStore } from '@/stores/user';
import PublicView from '@/views/public/public-view.vue';
import { useAppStore } from '@directus/stores';
import { User } from '@directus/types';
import { useHead } from '@unhead/vue';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const appStore = useAppStore();
const userStore = useUserStore();

const inputOTP = ref<any>(null);

onMounted(() => {
	if (appStore.authenticated === false) {
		router.push('/login');
	}
});

const {
	generateTFA,
	enableTFA,
	cancelTFASetup,
	loading,
	password,
	tfaEnabled,
	tfaGenerated,
	secret,
	otp,
	error,
	canvasID,
} = useTFASetup(false);

watch(
	() => tfaGenerated.value,
	async (generated) => {
		if (generated) {
			await nextTick();
			(inputOTP.value.$el as HTMLElement).querySelector('input')!.focus();
		}
	},
);

// Check if the current user is an OAuth user
const isOAuthUser = computed(() => {
	const user = userStore.currentUser;
	return user && !('share' in user) && user.provider !== DEFAULT_AUTH_DRIVER;
});

// Check if the user has role that requires TFA
const roleRequiresTFA = computed(() => {
	const user = userStore.currentUser;
	if (!user || 'share' in user) return false;
	return !!(user as any).enforce_tfa;
});

// Check if user can skip password (OAuth users can always skip password)
const canSkipPassword = computed(() => {
	return isOAuthUser.value;
});

// Check if cancel button should be shown (not shown if role requires TFA)
const showCancelButton = computed(() => {
	return !roleRequiresTFA.value;
});

async function generate() {
	await generateTFA(!canSkipPassword.value);
}

async function enable() {
	const success = await enableTFA();

	if (success) {
		navigateAfterTFA();
	} else {
		(inputOTP.value.$el as HTMLElement).querySelector('input')!.focus();
	}
}

async function cancel() {
	// If user has tfa_setup_status pending, call the API to cancel setup before redirecting
	try {
		await cancelTFASetup();
	} catch (error) {
		// If cancel fails, still redirect to avoid getting stuck
		// eslint-disable-next-line no-console
		console.error('Failed to cancel 2FA setup:', error);
	}

	navigateAfterTFA();
}

function navigateAfterTFA() {
	const redirectQuery = router.currentRoute.value.query.redirect as string;
	const fallback = (userStore.currentUser as User)?.last_page || '/login';

	// If redirect is an absolute URL, navigate via window.location to avoid double "/admin" prefix
	// This addresses an issue where the redirect URL is doubled when an SSO user is sent through the tfa setup flow
	if (typeof redirectQuery === 'string' && /^(https?:)?\/\//.test(redirectQuery)) {
		window.location.href = redirectQuery;
	} else {
		router.push(redirectQuery || fallback);
	}
}

useHead({
	title: t('tfa_setup'),
});
</script>

<template>
	<PublicView>
		<div class="header">
			<h1 class="type-title">{{ $t('tfa_setup') }}</h1>
		</div>

		<form v-if="tfaEnabled === false && tfaGenerated === false && loading === false" @submit.prevent="generate">
			<div class="title">
				{{ canSkipPassword ? $t('tfa_setup_description') : $t('enter_password_to_enable_tfa') }}
			</div>
			<div v-if="!canSkipPassword">
				<VInput v-model="password" :nullable="false" type="password" :placeholder="$t('password')" autofocus />
			</div>
			<VError v-if="error" :error="error" />
			<div class="actions">
				<button v-if="showCancelButton" type="button" class="cancel-link" @click="cancel">{{ $t('cancel') }}</button>
				<VButton type="submit" :loading="loading" large>{{ $t('next') }}</VButton>
			</div>
		</form>

		<VProgressCircular v-else-if="loading === true" class="loader" indeterminate />

		<div v-show="tfaEnabled === false && tfaGenerated === true && loading === false">
			<form @submit.prevent="enable">
				<div class="title">
					{{ $t('tfa_scan_code') }}
				</div>
				<div>
					<canvas :id="canvasID" class="qr" />
					<output class="secret">{{ secret }}</output>
					<VInput ref="inputOTP" v-model="otp" type="text" :placeholder="$t('otp')" :nullable="false" />
					<VError v-if="error" :error="error" />
				</div>
				<div class="actions">
					<button v-if="showCancelButton" type="button" class="cancel-link" @click="cancel">{{ $t('cancel') }}</button>
					<VButton type="submit" :disabled="otp.length !== 6" large @click="enable">{{ $t('done') }}</VButton>
				</div>
			</form>
		</div>

		<template #notice>
			<VIcon name="lock" left />
			{{ $t('not_authenticated') }}
		</template>
	</PublicView>
</template>

<style lang="scss" scoped>
h1 {
	margin-block-end: 20px;
}

.v-input,
.v-notice,
.v-error {
	margin-block-end: 20px;
}

.title {
	margin-block-end: 10px;
	font-weight: 600;
}

.qr {
	display: block;
	margin: 0 auto;
}

.secret {
	display: block;
	margin: 0 auto 16px;
	color: var(--theme--foreground-subdued);
	font-family: var(--theme--fonts--monospace--font-family);
	letter-spacing: 2.6px;
	text-align: center;
}

.actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.cancel-link {
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);
}

.cancel-link:hover {
	color: var(--theme--foreground);
}
</style>
