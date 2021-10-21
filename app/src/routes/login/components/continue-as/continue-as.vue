<template>
	<div class="continue-as">
		<v-progress-circular v-if="loading" indeterminate />
		<template v-else>
			<i18n-t keypath="continue_as" scope="global" tag="p">
				<template #name>
					<b>{{ name }}</b>
				</template>
			</i18n-t>
			<div class="actions">
				<router-link to="/logout" class="sign-out">{{ t('sign_out') }}</router-link>
				<v-button autofocus large @click="hydrateAndLogin">{{ t('continue_label') }}</v-button>
			</div>
		</template>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, onMounted } from 'vue';

import api from '@/api';
import { hydrate } from '@/hydrate';
import { useRouter } from 'vue-router';
import { userName } from '@/utils/user-name';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const router = useRouter();

		const loading = ref(false);
		const name = ref<string | null>(null);
		const lastPage = ref<string | null>(null);

		fetchUser();

		onMounted(() => {
			if ('continue' in router.currentRoute.value.query) {
				hydrateAndLogin();
			}
		});

		return { t, name, lastPage, loading, hydrateAndLogin };

		async function fetchUser() {
			loading.value = true;

			try {
				const response = await api.get(`/users/me`, {
					params: {
						fields: ['email', 'first_name', 'last_name', 'last_page'],
					},
				});

				name.value = userName(response.data.data);
				lastPage.value = response.data.data.last_page;
			} catch (err: any) {
				unexpectedError(err);
			} finally {
				loading.value = false;
			}
		}

		async function hydrateAndLogin() {
			await hydrate();
			router.push(lastPage.value || `/collections`);
		}
	},
});
</script>

<style scoped>
.continue-as p {
	margin-bottom: 32px;
}

.continue-as :deep(b) {
	font-weight: 600;
}

.continue-as .actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.continue-as .sign-out {
	color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);
}

.continue-as .sign-out:hover {
	color: var(--foreground-normal);
}
</style>
