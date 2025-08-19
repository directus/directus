<script setup lang="ts">
import { useTFASetup } from '@/composables/use-tfa-setup';
import { router } from '@/router';
import { useUserStore } from '@/stores/user';
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
	cancel2FASetup,
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
	return user && !('share' in user) && user.provider !== 'default';
});

// Check if the user has role that requires 2FA
const roleRequires2FA = computed(() => {
	const user = userStore.currentUser;
	if (!user || 'share' in user) return false;
	return (user as any).enforce_tfa === true;
});

// Check if cancel button should be shown (not shown if role requires 2FA)
const showCancelButton = computed(() => {
	return !roleRequires2FA.value;
});

async function generate() {
	await generateTFA(!isOAuthUser.value);
}

async function enable() {
	const success = await enableTFA(!isOAuthUser.value);

	if (success) {
		const redirectQuery = router.currentRoute.value.query.redirect as string;
		router.push(redirectQuery || (userStore.currentUser as User)?.last_page || '/login');
	} else {
		(inputOTP.value.$el as HTMLElement).querySelector('input')!.focus();
	}
}

async function cancel() {
	// If user has tfa_setup_status pending, call the API to cancel setup before redirecting
	try {
		await cancel2FASetup();
	} catch (error) {
		// If cancel fails, still redirect to avoid getting stuck
		// eslint-disable-next-line no-console
		console.error('Failed to cancel 2FA setup:', error);
	}

	const redirectQuery = router.currentRoute.value.query.redirect as string;
	router.push(redirectQuery || (userStore.currentUser as User)?.last_page || '/login');
}

useHead({
	title: t('tfa_setup'),
});
</script>

<template>
	<public-view>
		<div class="header">
			<h1 class="type-title">{{ t('tfa_setup') }}</h1>
		</div>

		<form v-if="tfaEnabled === false && tfaGenerated === false && loading === false" @submit.prevent="generate">
			<div class="title">
				{{ isOAuthUser ? t('tfa_setup_description') : t('enter_password_to_enable_tfa') }}
			</div>
			<div v-if="!isOAuthUser">
				<v-input v-model="password" :nullable="false" type="password" :placeholder="t('password')" autofocus />
			</div>
			<v-error v-if="error" :error="error" />
			<div class="actions">
				<button v-if="showCancelButton" type="button" class="cancel-link" @click="cancel">{{ t('cancel') }}</button>
				<v-button type="submit" :loading="loading" large>{{ t('next') }}</v-button>
			</div>
		</form>

		<v-progress-circular v-else-if="loading === true" class="loader" indeterminate />

		<div v-show="tfaEnabled === false && tfaGenerated === true && loading === false">
			<form @submit.prevent="enable">
				<div class="title">
					{{ t('tfa_scan_code') }}
				</div>
				<div>
					<canvas :id="canvasID" class="qr" />
					<output class="secret">{{ secret }}</output>
					<v-input ref="inputOTP" v-model="otp" type="text" :placeholder="t('otp')" :nullable="false" />
					<v-error v-if="error" :error="error" />
				</div>
				<div class="actions">
					<button v-if="showCancelButton" type="button" class="cancel-link" @click="cancel">{{ t('cancel') }}</button>
					<v-button type="submit" :disabled="otp.length !== 6" large @click="enable">{{ t('done') }}</v-button>
				</div>
			</form>
		</div>

		<template #notice>
			<v-icon name="lock" left />
			{{ t('not_authenticated') }}
		</template>
	</public-view>
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
