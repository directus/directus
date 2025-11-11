<script setup lang="ts">
import { RequestError } from '@/api';
import { login } from '@/auth';
import { translateAPIError } from '@/lang';
import { useUserStore } from '@/stores/user';
import { computed, ref, toRefs, watch } from 'vue';
import { useRouter } from 'vue-router';
import z from 'zod';

type Credentials = {
	email: string;
	password: string;
	otp?: string;
};

const props = defineProps<{
	provider: string;
}>();


const router = useRouter();

const { provider } = toRefs(props);
const loggingIn = ref(false);
const email = ref<string | null>(null);
const password = ref<string | null>(null);
const error = ref<RequestError | string | null>(null);
const otp = ref<string | null>(null);
const requiresTFA = ref(false);
const userStore = useUserStore();

watch(email, () => {
	if (requiresTFA.value === true) requiresTFA.value = false;
});

watch(provider, () => {
	email.value = null;
	password.value = null;
	error.value = null;
	otp.value = null;
	requiresTFA.value = false;
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

async function onSubmit() {
	// Simple RegEx, not for validation, but to prevent unnecessary login requests when the value is clearly invalid

	if (!z.email().safeParse(email.value).success || password.value === null) {
		error.value = 'INVALID_PAYLOAD';
		return;
	}

	try {
		loggingIn.value = true;

		const credentials: Credentials = {
			email: email.value!,
			password: password.value,
		};

		if (otp.value) {
			credentials.otp = otp.value;
		}

		await login({ provider: provider.value, credentials });

		const redirectQuery = router.currentRoute.value.query.redirect as string;

		let lastPage: string | null = null;

		if (userStore.currentUser && 'last_page' in userStore.currentUser) {
			lastPage = userStore.currentUser.last_page;
		}

		router.push(redirectQuery || lastPage || '/content');
	} catch (err: any) {
		if (err.errors?.[0]?.extensions?.code === 'INVALID_OTP' && requiresTFA.value === false) {
			requiresTFA.value = true;
			error.value = null;
		} else {
			error.value = err.errors?.[0]?.extensions?.code || err;
		}
	} finally {
		loggingIn.value = false;
	}
}
</script>

<template>
	<form novalidate @submit.prevent="onSubmit">
		<v-input v-model="email" autofocus autocomplete="username" type="email" :placeholder="$t('email')" />
		<interface-system-input-password :value="password" autocomplete="current-password" @input="password = $event" />

		<transition-expand>
			<v-input
				v-if="requiresTFA"
				v-model="otp"
				type="text"
				autocomplete="one-time-code"
				:placeholder="$t('otp')"
				autofocus
			/>
		</transition-expand>

		<v-notice v-if="error" type="warning">
			{{ errorFormatted }}
		</v-notice>
		<div class="buttons">
			<v-button class="sign-in" type="submit" :loading="loggingIn" large>
				<v-text-overflow :text="$t('sign_in')" />
			</v-button>
			<router-link to="/reset-password" class="forgot-password">
				{{ $$t('forgot_password') }}
			</router-link>
		</div>
	</form>
</template>

<style lang="scss" scoped>
.v-input,
.v-notice {
	margin-block-end: 20px;
}

.buttons {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.forgot-password {
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground);
	}
}

.sign-in {
	max-inline-size: 50%;
}
</style>
