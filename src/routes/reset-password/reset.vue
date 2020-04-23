<template>
	<form @submit.prevent="onSubmit">
		<v-input :value="email" disabled />
		<v-input
			:placeholder="$t('password')"
			autofocus
			autocomplete="username"
			type="password"
			v-model="password"
			:disabled="done"
		/>
		<v-notice success v-if="done">{{ $t('password_reset_successful') }}</v-notice>
		<v-notice danger v-if="error">
			{{ errorFormatted }}
		</v-notice>
		<v-button v-if="!done" type="submit" :loading="resetting" large>{{ $t('reset') }}</v-button>
		<v-button v-else large :to="signInLink">{{ $t('sign_in') }}</v-button>
	</form>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import useProjectsStore from '../../stores/projects';
import api from '@/api';
import { translateAPIError } from '@/lang';
import { RequestError } from '@/api';
import jwtPayload from '@/utils/jwt-payload';

export default defineComponent({
	props: {
		token: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const projectsStore = useProjectsStore();

		const password = ref(null);

		const resetting = ref(false);
		const error = ref<RequestError>(null);
		const done = ref(false);

		const errorFormatted = computed(() => {
			if (error.value) {
				return translateAPIError(error.value);
			}
			return null;
		});

		const signInLink = computed(() => `/${projectsStore.state.currentProjectKey}/login`);

		const email = computed(() => jwtPayload(props.token).email);

		return {
			resetting,
			error,
			done,
			password,
			currentProject: projectsStore.currentProject,
			onSubmit,
			signInLink,
			errorFormatted,
			email,
		};

		async function onSubmit() {
			resetting.value = true;
			error.value = null;

			try {
				await api.post(`/${projectsStore.state.currentProjectKey}/auth/password/reset`, {
					password: password.value,
					token: props.token,
				});

				done.value = true;
			} catch (err) {
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
