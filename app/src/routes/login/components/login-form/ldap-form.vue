<script setup lang="ts">
import { RequestError } from '@/api';
import { login } from '@/auth';
import TransitionExpand from '@/components/transition/expand.vue';
import VButton from '@/components/v-button.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { translateAPIError } from '@/lang';
import { useUserStore } from '@/stores/user';
import { computed, ref, toRefs, watch } from 'vue';
import { useRouter } from 'vue-router';

type Credentials = {
	identifier: string;
	password: string;
	otp?: string;
};

const props = defineProps<{
	provider: string;
}>();

const router = useRouter();

const { provider } = toRefs(props);
const loggingIn = ref(false);
const identifier = ref<string | null>(null);
const password = ref<string | null>(null);
const error = ref<RequestError | string | null>(null);
const otp = ref<string | null>(null);
const requiresTFA = ref(false);
const userStore = useUserStore();

watch(identifier, () => {
	if (requiresTFA.value === true) requiresTFA.value = false;
});

watch(provider, () => {
	identifier.value = null;
	password.value = null;
	error.value = null;
	otp.value = null;
	requiresTFA.value = false;
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

async function onSubmit() {
	if (identifier.value === null || password.value === null) return;

	try {
		loggingIn.value = true;

		const credentials: Credentials = {
			identifier: identifier.value,
			password: password.value,
		};

		if (otp.value) {
			credentials.otp = otp.value;
		}

		await login({ provider: provider.value, credentials });

		const redirectQuery = router.currentRoute.value.query.redirect as string;

		let lastPage: string | undefined;

		if (userStore.currentUser && 'last_page' in userStore.currentUser) {
			lastPage = userStore.currentUser.last_page;
		}

		router.push(redirectQuery || lastPage || '/content');
	} catch (err: any) {
		if (err.errors?.[0]?.extensions?.code === 'INVALID_OTP' && requiresTFA.value === false) {
			requiresTFA.value = true;
		} else {
			error.value = err.errors?.[0]?.extensions?.code || err;
		}
	} finally {
		loggingIn.value = false;
	}
}
</script>

<template>
	<form @submit.prevent="onSubmit">
		<v-input v-model="identifier" autofocus autocomplete="username" :placeholder="$t('identifier')" />
		<v-input v-model="password" type="password" autocomplete="current-password" :placeholder="$t('password')" />

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
		<v-button class="sign-in" type="submit" :loading="loggingIn" large>
			<v-text-overflow :text="$t('sign_in')" />
		</v-button>
	</form>
</template>

<style lang="scss" scoped>
.v-input,
.v-notice {
	margin-block-end: 20px;
}

.sign-in {
	max-inline-size: 50%;
}
</style>
