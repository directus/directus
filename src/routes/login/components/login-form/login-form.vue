<template>
	<form @submit.prevent="onSubmit">
		<v-input
			autofocus
			autocomplete="username"
			type="email"
			v-model="email"
			:placeholder="$t('email')"
			full-width
		/>
		<v-input
			type="password"
			autocomplete="current-password"
			v-model="password"
			:placeholder="$t('password')"
			full-width
		/>
		<v-notice danger v-if="error">
			{{ errorFormatted }}
		</v-notice>
		<div class="buttons">
			<v-button type="submit" :loading="loggingIn" large>{{ $t('sign_in') }}</v-button>
			<router-link :to="forgotLink" class="forgot-password">
				{{ $t('forgot_password') }}
			</router-link>
		</div>
	</form>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import router from '@/router';
import { useProjectsStore } from '@/stores/projects';
import { login } from '@/auth';
import { RequestError } from '@/api';
import { translateAPIError } from '@/lang';

export default defineComponent({
	setup() {
		const projectsStore = useProjectsStore();

		const loggingIn = ref(false);
		const email = ref<string>(null);
		const password = ref<string>(null);
		const error = ref<RequestError>(null);

		const errorFormatted = computed(() => {
			if (error.value) {
				return translateAPIError(error.value);
			}
			return null;
		});

		const forgotLink = computed(() => {
			return `/${projectsStore.state.currentProjectKey}/reset-password`;
		});

		return { errorFormatted, error, email, password, onSubmit, loggingIn, forgotLink };

		async function onSubmit() {
			if (email.value === null || password.value === null) return;

			const currentProjectKey = projectsStore.state.currentProjectKey;

			try {
				loggingIn.value = true;

				await login({
					email: email.value,
					password: password.value,
				});

				router.push(`/${currentProjectKey}/collections/`);
			} catch (err) {
				error.value = err;
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

.forgot-password {
	color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);
	&:hover {
		color: var(--foreground-normal);
	}
}
</style>
