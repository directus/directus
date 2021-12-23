<template>
	<public-view>
		<div class="header">
			<h1 class="type-title">{{ t('sign_in') }}</h1>
			<div v-if="!authenticated && providerOptions.length > 1" class="provider-select">
				<v-select v-model="providerSelect" inline :items="providerOptions" label />
			</div>
		</div>

		<continue-as v-if="authenticated" />

		<ldap-form v-else-if="driver === 'ldap'" :provider="provider" />

		<login-form v-else :provider="provider" />

		<sso-links v-if="!authenticated" :providers="providers" />

		<template v-if="authenticated" #notice>
			<v-icon name="lock_open" left />
			{{ t('authenticated') }}
		</template>
		<template v-else #notice>
			<v-icon name="lock_outlined" left />
			{{
				logoutReason && te(`logoutReason.${logoutReason}`) ? t(`logoutReason.${logoutReason}`) : t('not_authenticated')
			}}
		</template>
	</public-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, PropType, ref, onMounted } from 'vue';
import { LoginForm, LdapForm } from './components/login-form/';
import ContinueAs from './components/continue-as.vue';
import SsoLinks from './components/sso-links.vue';
import api from '@/api';
import { useAppStore } from '@/stores';
import { LogoutReason } from '@/auth';
import { AUTH_SSO_DRIVERS } from '@/constants';
import { unexpectedError } from '@/utils/unexpected-error';
import formatTitle from '@directus/format-title';
import { DEFAULT_AUTH_PROVIDER } from '@/constants';

export default defineComponent({
	components: { LoginForm, LdapForm, ContinueAs, SsoLinks },
	props: {
		logoutReason: {
			type: String as PropType<LogoutReason>,
			default: null,
		},
	},
	setup() {
		const { t, te } = useI18n();

		const appStore = useAppStore();

		const providers = ref<{ driver: string; name: string }[]>([]);
		const provider = ref(DEFAULT_AUTH_PROVIDER);
		const providerOptions = ref<{ text: string; value: string }[]>([]);
		const driver = ref('local');

		const providerSelect = computed({
			get() {
				return provider.value;
			},
			set(value: string) {
				provider.value = value;
				driver.value = providers.value.find((provider) => provider.name === value)?.driver ?? 'local';
			},
		});

		const authenticated = computed(() => appStore.authenticated);

		onMounted(() => fetchProviders());

		return { t, te, authenticated, providers, providerSelect, providerOptions, provider, driver };

		async function fetchProviders() {
			try {
				const response = await api.get('/auth');
				providers.value = response.data.data;

				providerOptions.value = providers.value
					.filter((provider) => !AUTH_SSO_DRIVERS.includes(provider.driver))
					.map((provider) => ({ text: formatTitle(provider.name), value: provider.name }));

				if (!response.data.disableDefault) {
					providerOptions.value.unshift({ text: t('default_provider'), value: DEFAULT_AUTH_PROVIDER });
				} else {
					providerSelect.value = providerOptions.value[0]?.value;
				}
			} catch (err: any) {
				unexpectedError(err);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
h1 {
	margin-bottom: 20px;
}

.header {
	display: flex;
	align-items: end;
	justify-content: space-between;
	margin-bottom: 20px;

	.type-title {
		margin-bottom: 0;
	}

	.provider-select {
		margin-bottom: 8px;
	}
}
</style>
