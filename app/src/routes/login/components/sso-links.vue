<template>
	<div class="sso-links">
		<template v-if="ssoProviders.length > 0">
			<v-divider />

			<a v-for="provider in ssoProviders" :key="provider.name" class="sso-link" :href="provider.link">
				<div class="sso-icon">
					<v-icon :name="provider.icon" />
				</div>
				<div class="sso-title">
					{{ t('log_in_with', { provider: provider.name }) }}
				</div>
			</a>
		</template>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, watch, toRefs } from 'vue';
import { AuthProvider } from '@/types';
import { AUTH_SSO_DRIVERS } from '@/constants';
import { getRootPath } from '@/utils/get-root-path';

export default defineComponent({
	props: {
		providers: {
			type: Array as PropType<AuthProvider[]>,
			default: () => [],
		},
	},
	setup(props) {
		const { t } = useI18n();

		const { providers } = toRefs(props);

		const ssoProviders = ref([]);

		watch(providers, () => {
			ssoProviders.value = providers.value
				.filter((provider: AuthProvider) => AUTH_SSO_DRIVERS.includes(provider.driver))
				.map((provider: AuthProvider) => ({
					name: provider.name,
					link: `${getRootPath()}auth/login/${provider.name.toLowerCase()}?redirect=${window.location.href}`,
					icon: provider.icon ?? 'account_circle',
				}));
		});

		return { t, ssoProviders };
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 24px 0;
}

.sso-link {
	display: flex;
	width: 100%;
	height: var(--input-height);
	background-color: var(--background-normal);
	border-radius: var(--border-radius);
	transition: background var(--fast) var(--transition);

	.sso-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--input-height);
		background-color: var(--background-normal-alt);
		border-radius: var(--border-radius);

		span {
			--v-icon-size: 32px;
		}
	}

	.sso-title {
		display: flex;
		align-items: center;
		padding: 0 16px;
		font-size: 16px;
	}

	& + & {
		margin-top: 12px;
	}
}
</style>
