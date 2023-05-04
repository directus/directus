<template>
	<form @submit.prevent="onSubmit">
		<v-input :model-value="email" disabled />
		<v-input
			v-model="password"
			:placeholder="t('password')"
			autofocus
			autocomplete="username"
			type="password"
			:disabled="done"
		/>
		<v-notice v-if="done" type="success">{{ t('password_reset_successful') }}</v-notice>
		<v-notice v-if="error" type="danger">
			{{ errorFormatted }}
		</v-notice>
		<v-button v-if="!done" type="submit" :loading="resetting" large>{{ t('reset') }}</v-button>
		<v-button v-else large :to="signInLink">{{ t('sign_in') }}</v-button>
	</form>
</template>

<script setup lang="ts">
import api, { RequestError } from '@/api';
import { translateAPIError } from '@/lang';
import { jwtPayload } from '@/utils/jwt-payload';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	token: string;
}>();

const { t } = useI18n();

const password = ref(null);

const resetting = ref(false);
const error = ref<RequestError | null>(null);
const done = ref(false);

const errorFormatted = computed(() => {
	if (error.value) {
		return translateAPIError(error.value);
	}

	return null;
});

const signInLink = computed(() => `/login`);

const email = computed(() => jwtPayload(props.token).email);

async function onSubmit() {
	resetting.value = true;
	error.value = null;

	try {
		await api.post(`/auth/password/reset`, {
			password: password.value,
			token: props.token,
		});

		done.value = true;
	} catch (err: any) {
		error.value = err;
	} finally {
		resetting.value = false;
	}
}
</script>

<style lang="scss" scoped>
.v-input,
.v-notice {
	margin-bottom: 20px;
}
</style>
