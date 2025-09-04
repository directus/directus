<script setup lang="ts">
import { RequestError } from '@/api';
import { useUserStore } from '@/stores/user';
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const otp = ref<string>('');
const loading = ref(false);
const error = ref<RequestError | string | null>(null);

onMounted(() => {
	// Check if we're on the 2FA verification page for OAuth
	if (route.query['2fa'] !== 'required') {
		router.push('/login');
	}
});

async function onSubmit() {
	if (!otp.value || otp.value.length !== 6) {
		error.value = 'INVALID_PAYLOAD';
		return;
	}

	try {
		loading.value = true;
		error.value = null;

		// Get the provider from the URL or query params
		const provider = (route.query.provider as string) || 'unknown';

		// Call the OAuth 2FA verification endpoint
		const response = await fetch('/auth/oauth2fa/verify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				otp: otp.value,
				provider: provider,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.errors?.[0]?.message || 'Verification failed');
		}

		// Refresh user data
		await userStore.hydrate();

		// Redirect to the intended destination
		const redirectQuery = route.query.redirect as string;
		router.push(redirectQuery || (userStore.currentUser as any)?.last_page || '/content');
	} catch (err: any) {
		error.value = err.message || 'Verification failed';
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<public-view>
		<div class="header">
			<h1 class="type-title">{{ t('two_factor_authentication') }}</h1>
		</div>

		<form @submit.prevent="onSubmit">
			<div class="title">
				{{ t('enter_otp') }}
			</div>
			<div>
				<v-input v-model="otp" type="text" :placeholder="t('otp')" :nullable="false" autofocus maxlength="6" />
			</div>
			<v-error v-if="error" :error="error" />
			<v-button type="submit" :loading="loading" :disabled="otp.length !== 6">
				{{ t('verify') }}
			</v-button>
		</form>

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
</style>
