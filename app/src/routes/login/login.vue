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

		<login-form v-else-if="driver === DEFAULT_AUTH_DRIVER || driver === 'local'" :provider="provider" />

		<sso-links v-if="!authenticated" :providers="auth.providers" />

		<template #notice>
			<div v-if="authenticated">
				<v-icon name="lock_open" left />
				{{ t('authenticated') }}
			</div>
			<div v-else>
				{{
					logoutReason && te(`logoutReason.${logoutReason}`)
						? t(`logoutReason.${logoutReason}`)
						: t('not_authenticated')
				}}
			</div>
		</template>
	</public-view>
</template>

<script setup lang="ts">
import { DEFAULT_AUTH_DRIVER, DEFAULT_AUTH_PROVIDER } from '@/constants';
import { useAppStore } from '@/stores/app';
import { useServerStore } from '@/stores/server';
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
const serverStore = useServerStore();
const { auth, providerOptions } = storeToRefs(serverStore);

const driver = ref(unref(auth).disableDefault ? unref(providerOptions)?.[0]?.driver : DEFAULT_AUTH_DRIVER);
const provider = ref(unref(auth).disableDefault ? unref(providerOptions)?.[0]?.value : DEFAULT_AUTH_PROVIDER);

const providerSelect = computed({
	get() {
		return provider.value;
	},
	set(value: string) {
		provider.value = value;
		driver.value = unref(auth).providers.find((provider) => provider.name === value)?.driver ?? DEFAULT_AUTH_DRIVER;
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
