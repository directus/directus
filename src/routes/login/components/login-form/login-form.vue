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
		<v-button type="submit" :loading="loggingIn" x-large>{{ $t('sign_in') }}</v-button>
	</form>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import router from '@/router';
import { useProjectsStore } from '@/stores/projects';
import { login } from '@/auth';

export default defineComponent({
	setup() {
		const projectsStore = useProjectsStore();

		const loggingIn = ref(false);
		const email = ref<string>(null);
		const password = ref<string>(null);

		return { email, password, onSubmit, loggingIn };

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
			} catch (error) {
				console.warn(error);
			} finally {
				loggingIn.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.v-input {
	margin-bottom: 32px;
}
</style>
