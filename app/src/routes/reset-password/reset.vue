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

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, computed } from 'vue';
import api from '@/api';
import { translateAPIError } from '@/lang';
import { RequestError } from '@/api';
import { jwtPayload } from '@/utils/jwt-payload';

export default defineComponent({
	props: {
		token: {
			type: String,
			required: true,
		},
	},
	setup(props) {
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

		return { t, resetting, error, done, password, onSubmit, signInLink, errorFormatted, email };

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
	},
});
</script>

<style lang="scss" scoped>
.v-input,
.v-notice {
	margin-bottom: 20px;
}
</style>
