<script setup lang="ts">
import { DEFAULT_AUTH_DRIVER, DEFAULT_AUTH_PROVIDER } from '@/constants';
import { useServerStore } from '@/stores/server';
import { useAppStore } from '@directus/stores';
import { useHead } from '@unhead/vue';
import { storeToRefs } from 'pinia';
import { computed, ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import SsoLinks from '../login/components/sso-links.vue';
import RegisterForm from './register-form.vue';

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
	title: t('register'),
});
</script>

<template>
	<public-view>
		<div class="header">
			<h1 class="type-title">{{ t('register') }}</h1>
			<router-link to="/login" class="login">
				{{ t('sign_in') }}
			</router-link>
			<div v-if="!authenticated && providerOptions.length > 1" class="provider-select">
				<v-select v-model="providerSelect" inline :items="providerOptions" label />
			</div>
		</div>

		<register-form :provider="provider" />

		<sso-links v-if="!authenticated" :providers="auth.providers" />

		<template #notice>
			<template v-if="authenticated">
				<v-icon name="lock_open" left />
				{{ t('authenticated') }}
			</template>
			<template v-else-if="logoutReason && te(`logoutReason.${logoutReason}`)">
				{{ t(`logoutReason.${logoutReason}`) }}
			</template>
			<template v-else>
				<v-icon name="lock" left />
				{{ t('not_authenticated') }}
			</template>
		</template>
	</public-view>
</template>

<style lang="scss" scoped>
h1 {
	margin-bottom: 20px;
}

.login {
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground);
	}
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
