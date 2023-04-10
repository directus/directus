<template>
	<div class="sso-links">
		<template v-if="ssoProviders.length > 0">
			<v-divider />

			<v-notice v-if="errorFormatted" type="warning">
				{{ errorFormatted }}
			</v-notice>

			<a v-for="provider in ssoProviders" :key="provider.name" class="sso-link" :href="provider.link">
				<div class="sso-icon">
					<v-icon :name="provider.icon" />
				</div>
				<div class="sso-title">
					{{ t('log_in_with', { provider: provider.label }) }}
				</div>
			</a>
		</template>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, computed, watch, toRefs, PropType } from 'vue';
import { useRouter } from 'vue-router';
import { AuthProvider } from '@/types/login';
import { AUTH_SSO_DRIVERS } from '@/constants';
import { translateAPIError } from '@/lang';
import { getRootPath } from '@/utils/get-root-path';
import formatTitle from '@directus/format-title';

export default defineComponent({
	props: {
		providers: {
			type: Array as PropType<AuthProvider[]>,
			default: () => [],
		},
	},
	setup(props) {
		const { t } = useI18n();

		const router = useRouter();

		const { providers } = toRefs(props);
		const ssoProviders = ref<{ name: string; link: string; icon: string }[]>([]);

		watch(
			providers,
			() => {
				ssoProviders.value = providers.value
					.filter((provider: AuthProvider) => AUTH_SSO_DRIVERS.includes(provider.driver))
					.map((provider: AuthProvider) => ({
						name: provider.name,
						label: provider.label || formatTitle(provider.name),
						link: `${getRootPath()}auth/login/${provider.name}?redirect=${window.location.href.replace(
							location.search,
							''
						)}?continue`,
						icon: provider.icon ?? 'account_circle',
					}));
			},
			{ immediate: true }
		);

		const errorFormatted = computed(() => {
			const validReasons = ['SIGN_OUT', 'SESSION_EXPIRED'];

			if (router.currentRoute.value.query.reason && !validReasons.includes(router.currentRoute.value.query.reason)) {
				return translateAPIError(router.currentRoute.value.query.reason);
			}
			return null;
		});

		return { t, ssoProviders, errorFormatted };
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 24px 0;
}

.v-notice {
	margin-bottom: 20px;
}

.sso-link {
	$sso-link-border-width: 2px;

	display: flex;
	width: 100%;
	height: var(--input-height);
	background-color: var(--background-normal);
	border: $sso-link-border-width var(--background-normal) solid;
	border-radius: var(--border-radius);
	transition: border-color var(--fast) var(--transition);

	.sso-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--input-height);
		margin: -$sso-link-border-width;
		background-color: var(--background-normal-alt);
		border-radius: var(--border-radius);

		span {
			--v-icon-size: 28px;
		}
	}

	.sso-title {
		display: flex;
		align-items: center;
		padding: 0 16px 0 20px;
		font-size: 16px;
	}

	&:hover {
		border-color: var(--background-normal-alt);
	}

	& + & {
		margin-top: 12px;
	}
}
</style>
