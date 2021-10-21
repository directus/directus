<template>
	<form @submit.prevent="onSubmit">
		<v-input v-model="email" autofocus autocomplete="username" type="email" :placeholder="t('email')" />
		<v-input v-model="password" type="password" autocomplete="current-password" :placeholder="t('password')" />

		<transition-expand>
			<v-input v-if="requiresTFA" v-model="otp" type="text" :placeholder="t('otp')" autofocus />
		</transition-expand>

		<v-notice v-if="error" type="warning">
			{{ errorFormatted }}
		</v-notice>
		<div class="buttons">
			<v-button type="submit" :loading="loggingIn" large>{{ t('sign_in') }}</v-button>
			<router-link to="/reset-password" class="forgot-password">
				{{ t('forgot_password') }}
			</router-link>
		</div>

		<sso-links :providers="providers" />
	</form>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ssoLinks from '../sso-links.vue';
import { login } from '@/auth';
import api, { RequestError } from '@/api';
import { translateAPIError } from '@/lang';
import { useUserStore } from '@/stores';
import { unexpectedError } from '@/utils/unexpected-error';

type Credentials = {
	email: string;
	password: string;
	otp?: string;
};

export default defineComponent({
	components: { ssoLinks },
	setup() {
		const { t } = useI18n();

		const router = useRouter();

		const loggingIn = ref(false);
		const email = ref<string | null>(null);
		const password = ref<string | null>(null);
		const error = ref<RequestError | string | null>(null);
		const otp = ref<string | null>(null);
		const requiresTFA = ref(false);
		const providers = ref([]);
		const userStore = useUserStore();

		onMounted(() => fetchProviders());

		watch(email, () => {
			if (requiresTFA.value === true) requiresTFA.value = false;
		});

		const errorFormatted = computed(() => {
			// Show "Wrong username or password" for wrongly formatted emails as well
			if (error.value === 'INVALID_PAYLOAD') {
				return translateAPIError('INVALID_CREDENTIALS');
			}

			if (error.value) {
				return translateAPIError(error.value);
			}
			return null;
		});

		return {
			t,
			errorFormatted,
			error,
			email,
			password,
			onSubmit,
			loggingIn,
			translateAPIError,
			otp,
			requiresTFA,
			providers,
		};

		async function fetchProviders() {
			try {
				const response = await api.get('/auth');
				providers.value = response.data.data;
			} catch (err: any) {
				unexpectedError(err);
			}
		}

		async function onSubmit() {
			if (email.value === null || password.value === null) return;

			try {
				loggingIn.value = true;

				const credentials: Credentials = {
					email: email.value,
					password: password.value,
				};

				if (otp.value) {
					credentials.otp = otp.value;
				}

				await login(credentials);

				// Stores are hydrated after login
				const lastPage = userStore.currentUser?.last_page;
				router.push(lastPage || '/collections');
			} catch (err: any) {
				if (err.response?.data?.errors?.[0]?.extensions?.code === 'INVALID_OTP' && requiresTFA.value === false) {
					requiresTFA.value = true;
				} else {
					error.value = err.response?.data?.errors?.[0]?.extensions?.code || err;
				}
			} finally {
				loggingIn.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.v-input,
.v-notice {
	margin-bottom: 20px;
}

.buttons {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.forgot-password {
	color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--foreground-normal);
	}
}
</style>
