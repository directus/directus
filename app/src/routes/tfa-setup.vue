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
	generateTFAForOAuth,
	enableTFA,
	enableTFAForOAuth,
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

async function generate() {
	if (isOAuthUser.value) {
		await generateTFAForOAuth();
	} else {
		await generateTFA();
	}
}

async function enable() {
	let success;

	if (isOAuthUser.value) {
		success = await enableTFAForOAuth();
	} else {
		success = await enableTFA();
	}

	if (success) {
		const redirectQuery = router.currentRoute.value.query.redirect as string;
		router.push(redirectQuery || (userStore.currentUser as User)?.last_page || '/login');
	} else {
		(inputOTP.value.$el as HTMLElement).querySelector('input')!.focus();
	}
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
				{{ isOAuthUser ? t('enable_2fa_for_oauth') : t('enter_password_to_enable_tfa') }}
			</div>
			<div v-if="!isOAuthUser">
				<v-input v-model="password" :nullable="false" type="password" :placeholder="t('password')" autofocus />
			</div>
			<v-error v-if="error" :error="error" />
			<v-button type="submit" :loading="loading">{{ t('next') }}</v-button>
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
				<v-button type="submit" :disabled="otp.length !== 6" @click="enable">{{ t('done') }}</v-button>
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
</style>
