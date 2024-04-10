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

const wasSuccessful = ref(false);

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
			<div v-if="!authenticated && providerOptions.length > 1" class="provider-select">
				<v-select v-model="providerSelect" inline :items="providerOptions" label />
			</div>
		</div>

		<!-- TODO CHANGE KEY -->
		<div v-if="wasSuccessful" class="after-success">
			<div v-md="t('registration_successful_note')"></div>
			<v-button large to="/login">{{ t('sign_in') }}</v-button>
		</div>

		<register-form v-else :provider="provider" @was-successful="wasSuccessful = $event" />

		<!-- TODO: SSO links should be dependent on the setting for generating users on login -->

		<sso-links v-if="!authenticated && wasSuccessful == false" :providers="auth.providers" />

		<div v-if="wasSuccessful == false" class="login-wrapper">
			{{ t('already_have_an_account') }}
			<router-link to="/login" class="login-link">
				{{ t('sign_in') }}
			</router-link>
		</div>

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

.login-wrapper {
	margin-top: 20px;
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	gap: 0.5rem;
	text-align: center;
	color: var(--theme--foreground-subdued);
}

.login-link {
	color: var(--theme--foreground);
}

.after-success {
	display: flex;
	flex-direction: column;
	gap: 20px;
}
</style>
