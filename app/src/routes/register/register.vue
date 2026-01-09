<script setup lang="ts">
import { useAppStore } from '@directus/stores';
import { useHead } from '@unhead/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import RegisterForm from './register-form.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { useServerStore } from '@/stores/server';
import PublicView from '@/views/public/public-view.vue';

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
const authenticated = computed(() => appStore.authenticated);
const wasSuccessful = ref(false);
const requiresEmailVerification = computed(() => serverStore.info.project?.public_registration_verify_email);

useHead({
	title: t('register'),
});
</script>

<template>
	<PublicView>
		<div class="header">
			<h1 class="type-title">{{ wasSuccessful ? $t('registration_successful_headline') : $t('register') }}</h1>
		</div>

		<div v-if="wasSuccessful" class="after-success">
			<div
				v-md="
					requiresEmailVerification
						? $t('registration_successful_check_email_note')
						: $t('registration_successful_note')
				"
			></div>
			<VButton large to="/login">{{ $t('sign_in') }}</VButton>
		</div>

		<RegisterForm v-else @was-successful="wasSuccessful = $event" />

		<div v-if="wasSuccessful == false" class="login-wrapper">
			{{ $t('already_have_an_account') }}
			<RouterLink to="/login" class="login-link">
				{{ $t('sign_in') }}
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
	margin-block-end: 20px;
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
	margin-block-end: 20px;

	.type-title {
		margin-block-end: 0;
	}

	.provider-select {
		margin-block-end: 8px;
	}
}

.login-wrapper {
	margin-block-start: 3rem;
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
