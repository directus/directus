<template>
	<public-view>
		<form @submit.prevent="onSubmit">
			<v-input type="email" v-model="email" />
			<v-input type="password" v-model="password" />
			<v-button type="submit" :loading="loggingIn">Login</v-button>
		</form>

		<template #notice>
			<v-icon name="person" left />
			Not Authenticated
		</template>
	</public-view>
</template>

<script lang="ts">
import { createComponent, ref } from '@vue/composition-api';
import api from '@/api';
import { useProjectsStore } from '@/stores/projects';
import router from '@/router';

export default createComponent({
	setup() {
		const projectsStore = useProjectsStore();

		const loggingIn = ref(false);
		const email = ref<string>(null);
		const password = ref<string>(null);

		return { email, password, onSubmit, loggingIn };

		async function onSubmit() {
			const currentProjectKey = projectsStore.state.currentProjectKey;

			try {
				loggingIn.value = true;

				await api.post(`/${currentProjectKey}/auth/authenticate`, {
					mode: 'cookie',
					email: email.value,
					password: password.value
				});

				router.push(`/${currentProjectKey}/`);
			} catch (error) {
				console.warn(error);
			} finally {
				loggingIn.value = false;
			}
		}
	}
});
</script>
