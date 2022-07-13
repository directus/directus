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

		<login-form v-else-if="!auth.disableDefault" :provider="provider" />

		<sso-links v-if="!authenticated" :providers="auth.providers" />

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

<script lang="ts" setup>
import { DEFAULT_AUTH_PROVIDER } from '@/constants';
import { useAppStore, useServerStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { computed, ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import ContinueAs from './components/continue-as.vue';
import { LdapForm, LoginForm } from './components/login-form/';
import SsoLinks from './components/sso-links.vue';

interface Props {
	logoutReason?: string | null;
}

withDefaults(defineProps<Props>(), {
	logoutReason: null,
});

const { t, te } = useI18n();

const appStore = useAppStore();
const driver = ref('local');
const provider = ref(DEFAULT_AUTH_PROVIDER);
const serverStore = useServerStore();

const { auth, providerOptions } = storeToRefs(serverStore);

const providerSelect = computed({
	get() {
		return provider.value;
	},
	set(value: string) {
		provider.value = value;
		driver.value = unref(auth).providers.find((provider) => provider.name === value)?.driver ?? 'local';
	},
});

const authenticated = computed(() => appStore.authenticated);
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
