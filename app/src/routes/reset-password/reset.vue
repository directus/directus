<script setup lang="ts">
import api, { RequestError } from '@/api';
import VButton from '@/components/v-button.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import { translateAPIError } from '@/lang';
import { jwtPayload } from '@/utils/jwt-payload';
import { useHead } from '@unhead/vue';
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

useHead({
	title: t('reset_password'),
});
</script>

<template>
	<form @submit.prevent="onSubmit">
		<VInput :model-value="email" disabled />
		<VInput
			v-model="password"
			:placeholder="$t('password')"
			autofocus
			autocomplete="username"
			type="password"
			:disabled="done"
		/>
		<VNotice v-if="done" type="success">{{ $t('password_reset_successful') }}</VNotice>
		<VNotice v-if="error" type="danger">
			{{ errorFormatted }}
		</VNotice>
		<VButton v-if="!done" type="submit" :loading="resetting" large>{{ $t('reset') }}</VButton>
		<VButton v-else large :to="signInLink">{{ $t('sign_in') }}</VButton>
	</form>
</template>

<style lang="scss" scoped>
.v-input,
.v-notice {
	margin-block-end: 20px;
}
</style>
