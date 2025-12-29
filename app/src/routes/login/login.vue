<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VSelect from '@/components/v-select/v-select.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { DEFAULT_AUTH_DRIVER, DEFAULT_AUTH_PROVIDER } from '@/constants';
import { useServerStore } from '@/stores/server';
import PublicView from '@/views/public';
import { useAppStore } from '@directus/stores';
import { useHead } from '@unhead/vue';
import { storeToRefs } from 'pinia';
import { computed, ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import ContinueAs from './components/continue-as.vue';
import { LdapForm, LoginForm } from './components/login-form/';
import SsoLinks from './components/sso-links.vue';

withDefaults(
	defineProps<{
		logoutReason?: string | null;
	}>(),
	{
		logoutReason: null,
	},
);

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

useHead({
	title: t('sign_in'),
});
</script>

<template>
	<PublicView>
		<div class="header">
			<h1 class="type-title"><VTextOverflow :text="$t('sign_in')" /></h1>
			<div v-if="!authenticated && providerOptions.length > 1" class="provider-select">
				<VSelect v-model="providerSelect" inline :items="providerOptions" label />
			</div>
		</div>

		<ContinueAs v-if="authenticated" />

		<LdapForm v-else-if="driver === 'ldap'" :provider="provider" />

		<LoginForm v-else-if="driver === DEFAULT_AUTH_DRIVER || driver === 'local'" :provider="provider" />

		<SsoLinks v-if="!authenticated" :providers="auth.providers" />

		<div v-if="!authenticated && serverStore.info.project?.public_registration" class="registration-wrapper">
			{{ $t('dont_have_an_account') }}
			<RouterLink to="/register" class="registration-link">
				{{ $t('sign_up_now') }}
			</RouterLink>
		</div>

		<template #notice>
			<template v-if="authenticated">
				<VIcon name="lock_open" left />
				{{ $t('authenticated') }}
			</template>
			<template v-else-if="logoutReason && te(`logoutReason.${logoutReason}`)">
				{{ $t(`logoutReason.${logoutReason}`) }}
			</template>
			<template v-else>
				<VIcon name="lock" left />
				{{ $t('not_authenticated') }}
			</template>
		</template>
	</PublicView>
</template>

<style lang="scss" scoped>
h1 {
	overflow: hidden;
}

.registration-wrapper {
	margin-block-start: 3rem;
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	gap: 0.5rem;
	text-align: center;
	color: var(--theme--foreground-subdued);
}

.registration-link {
	color: var(--theme--foreground);
}

.header {
	display: flex;
	align-items: end;
	justify-content: space-between;
	margin-block-end: 20px;

	.type-title {
		margin-block-end: 0;
	}

	.provider-select {
		margin-block-end: 8px;
	}
}
</style>
