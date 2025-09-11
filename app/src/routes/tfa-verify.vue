<script setup lang="ts">
import api, { RequestError } from '@/api';
import { hydrate } from '@/hydrate';
import { useUserStore } from '@/stores/user';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const otp = ref<string>('');
const loading = ref(false);
const error = ref<RequestError | string | null>(null);

async function onSubmit() {
	if (!otp.value || otp.value.length !== 6) {
		error.value = 'INVALID_PAYLOAD';
		return;
	}

	try {
		loading.value = true;
		error.value = null;

		await api.post('/auth/verify', { otp: otp.value, mode: 'session' });

		// Refresh user data
		await hydrate();

		// Redirect to the intended destination
		const redirectQuery = route.query.redirect as string;
		router.push(redirectQuery || (userStore.currentUser as any)?.last_page || '/content');
	} catch (err: any) {
		error.value = err || 'Verification failed';
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<public-view>
		<div class="header">
			<h1 class="type-title">{{ t('otp_required') }}</h1>
		</div>

		<form @submit.prevent="onSubmit">
			<div>
				<v-input v-model="otp" type="text" :placeholder="t('otp')" :nullable="false" autofocus maxlength="6" />
			</div>
			<v-error v-if="error" :error="error" />

			<div class="actions">
				<router-link to="/logout" class="sign-out">{{ t('sign_out') }}</router-link>
				<v-button large type="submit" :loading="loading" :disabled="otp.length !== 6">
					{{ t('continue_label') }}
				</v-button>
			</div>
		</form>
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

.continue-as p {
	margin-block-end: 32px;
}

.actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.sign-out {
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);
}

.sign-out:hover {
	color: var(--theme--foreground);
}
</style>
