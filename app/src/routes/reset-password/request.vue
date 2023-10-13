<script setup lang="ts">
import api, { RequestError } from '@/api';
import { translateAPIError } from '@/lang';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const email = ref(null);

const sending = ref(false);
const error = ref<RequestError | null>(null);
const done = ref(false);

const errorFormatted = computed(() => {
	if (error.value) {
		return translateAPIError(error.value);
	}

	return null;
});

const signInLink = computed(() => `/login`);

async function onSubmit() {
	sending.value = true;
	error.value = null;

	try {
		await api.post(`/auth/password/request`, {
			email: email.value,
		});

		done.value = true;
	} catch (err: any) {
		error.value = err;
	} finally {
		sending.value = false;
	}
}
</script>

<template>
	<form @submit.prevent="onSubmit">
		<v-input v-model="email" autofocus autocomplete="username" type="email" :placeholder="t('email')" />
		<v-notice v-if="done" type="success">{{ t('password_reset_sent') }}</v-notice>
		<v-notice v-if="error" type="danger">
			{{ errorFormatted }}
		</v-notice>
		<div class="buttons">
			<v-button type="submit" :loading="sending" large>{{ t('reset') }}</v-button>
			<router-link :to="signInLink" class="sign-in">{{ t('sign_in') }}</router-link>
		</div>
	</form>
</template>

<style lang="scss" scoped>
.buttons {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.v-input,
.v-notice {
	margin-bottom: 20px;
}

.sign-in {
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground);
	}
}
</style>
