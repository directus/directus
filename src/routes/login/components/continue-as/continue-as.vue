<template>
	<div class="continue-as">
		<v-progress-circular v-if="loading" indeterminate />
		<template v-else>
			<p v-html="$t('continue_as', { name })" />
			<div class="actions">
				<router-link :to="signOutLink" class="sign-out">{{ $t('sign_out') }}</router-link>
				<v-button large @click="hydrateAndLogin">{{ $t('continue') }}</v-button>
			</div>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, watch, ref } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import api from '@/api';
import { hydrate } from '@/hydrate';
import router from '@/router';

export default defineComponent({
	setup() {
		const projectsStore = useProjectsStore();

		const signOutLink = computed<string>(() => {
			return `/${projectsStore.state.currentProjectKey}/logout`;
		});

		const loading = ref(false);
		const error = ref(null);
		const name = ref<string | null>(null);
		const lastPage = ref<string | null>(null);

		watch(() => projectsStore.state.currentProjectKey, fetchUser);

		return { name, lastPage, signOutLink, loading, error, hydrateAndLogin };

		async function fetchUser(projectKey: string | null) {
			loading.value = true;
			error.value = null;

			try {
				const response = await api.get(`/${projectKey}/users/me`, {
					params: {
						fields: ['first_name', 'last_name', 'last_page'],
					},
				});

				name.value = response.data.data.first_name + ' ' + response.data.data.last_name;
				lastPage.value = response.data.data.last_page;
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}

		async function hydrateAndLogin() {
			await hydrate();
			router.push(`/${projectsStore.state.currentProjectKey}/collections/`);
		}
	},
});
</script>

<style lang="scss" scoped>
.continue-as {
	p {
		margin-bottom: 32px;
	}

	::v-deep {
		// In the translated string for continue as, there's a B element to emphasize the users name
		b {
			font-weight: 500;
		}
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.sign-out {
		color: var(--foreground-subdued);
		transition: color var(--fast) var(--transition);
		&:hover {
			color: var(--foreground-normal);
		}
	}
}
</style>
