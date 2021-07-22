<template>
	<div class="sso-links">
		<template v-if="authProviders?.length > 0 || oauthProviders?.length > 0">
			<v-divider />

			<router-link
				class="sso-link"
				v-for="provider in authProviders"
				:key="provider.name"
				:to="'/login?provider=' + provider.name"
			>
				{{ t('log_in_with', { provider: provider.name }) }}
			</router-link>

			<a class="sso-link" v-for="provider in oauthProviders" :key="provider.name" :href="provider.link">
				{{ t('log_in_with', { provider: provider.name }) }}
			</a>
		</template>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, onMounted } from 'vue';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const authProviders = ref([]);
		const oauthProviders = ref([]);
		const loading = ref(false);

		onMounted(() => fetchProviders());

		return { t, authProviders, oauthProviders };

		async function fetchProviders() {
			loading.value = true;

			try {
				const [authResponse, oauthResponse] = await Promise.all([api.get('/auth/'), api.get('/auth/oauth/')]);

				authProviders.value = authResponse.data.data?.map((providerName: string) => ({
					name: providerName,
				}));

				oauthProviders.value = oauthResponse.data.data?.map((providerName: string) => ({
					name: providerName,
					link: `${getRootPath()}auth/oauth/${providerName.toLowerCase()}?redirect=${window.location.href}`,
				}));
			} catch (err) {
				unexpectedError(err);
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 24px 0;
}

.sso-link {
	display: block;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: var(--input-height);
	text-align: center;
	background-color: var(--background-normal);
	border-radius: var(--border-radius);
	transition: background var(--fast) var(--transition);

	&:hover {
		background-color: var(--background-normal-alt);
	}

	& + & {
		margin-top: 12px;
	}
}
</style>
