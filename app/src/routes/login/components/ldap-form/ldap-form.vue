<template>
	<form @submit.prevent="onSubmit">
		<p>
			<br />
			LDAP Login:
		</p>
		<v-input type="username" autofocus autocomplete="username" v-model="userCN" :placeholder="t('username')" />
		<v-input type="password" autocomplete="current-password" v-model="password" :placeholder="t('password')" />

		<transition-expand>
			<v-input type="text" :placeholder="t('otp')" v-if="requiresTFA" v-model="otp" autofocus />
		</transition-expand>

		<v-notice type="warning" v-if="error">
			{{ errorFormatted }}
		</v-notice>
		<div class="buttons">
			<v-button type="submit" :loading="loggingIn" large>{{ t('sign_in') }}</v-button>
			<router-link to="/login" class="back-link">
				{{ t('back') }}
			</router-link>
		</div>
	</form>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ldapLogin } from '@/auth';
import { RequestError } from '@/api';
import { translateAPIError } from '@/lang';
import { useUserStore } from '@/stores';

type Credentials = {
	userCN: string;
	password: string;
	otp?: string;
};

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const router = useRouter();

		const loggingIn = ref(false);
		const userCN = ref<string | null>(null);
		const password = ref<string | null>(null);
		const error = ref<RequestError | string | null>(null);
		const otp = ref<string | null>(null);
		const requiresTFA = ref(false);
		const userStore = useUserStore();

		watch(userCN, () => {
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

		return { t, errorFormatted, error, userCN, password, onSubmit, loggingIn, translateAPIError, otp, requiresTFA };

		async function onSubmit() {
			if (userCN.value === null || password.value === null) return;

			try {
				loggingIn.value = true;

				const credentials: Credentials = {
					userCN: userCN.value,
					password: password.value,
				};

				if (otp.value) {
					credentials.otp = otp.value;
				}

				await ldapLogin(credentials);

				// Stores are hydrated after login
				const lastPage = userStore.currentUser?.last_page;
				router.push(lastPage || '/collections');
			} catch (err) {
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

.back-link {
	color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--foreground-normal);
	}
}
</style>
