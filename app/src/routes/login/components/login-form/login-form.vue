<template>
	<form @submit.prevent="onSubmit">
		<v-input
			v-if="provider"
			v-model="identifier"
			autofocus
			autocomplete="username"
			type="text"
			:placeholder="t('identifier')"
		/>
		<v-input v-else v-model="email" autofocus autocomplete="username" type="email" :placeholder="t('email')" />
		<v-input v-model="password" type="password" autocomplete="current-password" :placeholder="t('password')" />

		<transition-expand>
			<v-input v-if="requiresTFA" v-model="otp" type="text" :placeholder="t('otp')" autofocus />
		</transition-expand>

		<v-notice v-if="error" type="warning">
			{{ errorFormatted }}
		</v-notice>
		<div class="buttons">
			<v-button type="submit" :loading="loggingIn" large>{{ t('sign_in') }}</v-button>
			<router-link v-if="provider" to="/login" class="auth-link">
				{{ t('back') }}
			</router-link>
			<router-link v-else to="/reset-password" class="auth-link">
				{{ t('forgot_password') }}
			</router-link>
		</div>

		<sso-links v-if="!provider" />
	</form>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, computed, watch, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import ssoLinks from '../sso-links.vue';
import { login } from '@/auth';
import { RequestError } from '@/api';
import { translateAPIError } from '@/lang';
import { useUserStore } from '@/stores';

type Credentials = {
	identifier?: string;
	email?: string;
	password: string;
	otp?: string;
};

export default defineComponent({
	components: { ssoLinks },
	props: {
		provider: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();
		const { provider } = toRefs(props);

		const router = useRouter();

		const loggingIn = ref(false);
		const identifier = ref<string | null>(null);
		const email = ref<string | null>(null);
		const password = ref<string | null>(null);
		const error = ref<RequestError | string | null>(null);
		const otp = ref<string | null>(null);
		const requiresTFA = ref(false);
		const userStore = useUserStore();

		watch(provider, () => {
			identifier.value = null;
			email.value = null;
			password.value = null;
			error.value = null;
			otp.value = null;
			requiresTFA.value = false;
		});

		watch([identifier, email], () => {
			if (requiresTFA.value === true) requiresTFA.value = false;
		});

		const errorFormatted = computed(() => {
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
			identifier,
			email,
			password,
			onSubmit,
			loggingIn,
			translateAPIError,
			otp,
			requiresTFA,
		};

		async function onSubmit() {
			if ((!identifier.value && !email.value) || !password.value) return;

			try {
				loggingIn.value = true;

				const credentials: Credentials = {
					password: password.value,
				};

				if (email.value) {
					credentials.email = email.value;
				} else {
					credentials.identifier = identifier.value;
				}

				if (provider.value) {
					credentials.provider = provider.value;
				}

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

.auth-link {
	color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--foreground-normal);
	}
}
</style>
