<script setup lang="ts">
import api, { RequestError } from '@/api';
import { translateAPIError } from '@/lang';
import { ErrorCode } from '@directus/errors';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

type Credentials = {
	email: string;
	password: string;
};

const { t } = useI18n();
const isLoading = ref(false);
const email = ref<string | null>(null);
const password = ref<string | null>(null);
const passwordVerification = ref<string | null>(null);
const error = ref<RequestError | string | null>(null);
const passwordsMatch = computed(() => password.value === passwordVerification.value);

const emit = defineEmits<{
	wasSuccessful: [boolean];
}>();

const errorFormatted = computed(() => {
	// Show "Wrong username or password" for wrongly formatted emails as well
	if (error.value === ErrorCode.InvalidPayload) {
		return translateAPIError(ErrorCode.InvalidCredentials);
	}

	if (error.value) {
		return translateAPIError(error.value);
	}

	return null;
});

async function onSubmit() {
	// Simple RegEx, not for validation, but to prevent unnecessary login requests when the value is clearly invalid
	const emailRegex = /^\S+@\S+$/;

	if (
		email.value === null ||
		!emailRegex.test(email.value) ||
		password.value === null ||
		passwordsMatch.value === false
	) {
		error.value = ErrorCode.InvalidPayload;
		return;
	}

	try {
		isLoading.value = true;

		const credentials: Credentials = {
			email: email.value,
			password: password.value,
		};

		await api.post('/users/register', credentials);

		emit('wasSuccessful', true);
	} catch (err: any) {
		error.value = err.errors?.[0]?.extensions?.code || err;
		emit('wasSuccessful', false);
	} finally {
		isLoading.value = false;
	}
}
</script>

<template>
	<form novalidate @submit.prevent="onSubmit">
		<v-input
			v-model="email"
			autofocus
			autocomplete="username"
			type="email"
			:placeholder="t('email')"
			:disabled="isLoading"
		/>
		<v-input
			v-model="password"
			type="password"
			autocomplete="new-password"
			:placeholder="t('password')"
			:disabled="isLoading"
		/>
		<v-input
			v-model="passwordVerification"
			type="password"
			autocomplete="new-password"
			:placeholder="t('confirm_password')"
			:disabled="isLoading"
		/>

		<v-notice v-if="error" type="warning">
			{{ errorFormatted }}
		</v-notice>
		<div class="buttons">
			<v-button type="submit" :loading="isLoading" :disabled="isLoading" large>{{ t('register') }}</v-button>
		</div>
	</form>
</template>

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
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground);
	}
}
</style>
