<script setup lang="ts">
import { useTFASetup } from '@/composables/use-tfa-setup';
import { router } from '@/router';
import { useUserStore } from '@/stores/user';
import { useAppStore } from '@directus/stores';
import { User } from '@directus/types';
import { nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const appStore = useAppStore();
const userStore = useUserStore();

const inputOTP = ref<any>(null);

onMounted(() => {
	if (appStore.authenticated === false) {
		router.push('/login');
	}
});

const { generateTFA, enableTFA, loading, password, tfaEnabled, tfaGenerated, secret, otp, error, canvasID } =
	useTFASetup(false);

watch(
	() => tfaGenerated.value,
	async (generated) => {
		if (generated) {
			await nextTick();
			(inputOTP.value.$el as HTMLElement).querySelector('input')!.focus();
		}
	}
);

async function enable() {
	await enableTFA();

	if (error.value === null) {
		const redirectQuery = router.currentRoute.value.query.redirect as string;
		router.push(redirectQuery || (userStore.currentUser as User)?.last_page || '/login');
	} else {
		(inputOTP.value.$el as HTMLElement).querySelector('input')!.focus();
	}
}
</script>

<template>
	<public-view>
		<div class="header">
			<h1 class="type-title">{{ t('tfa_setup') }}</h1>
		</div>

		<form v-if="tfaEnabled === false && tfaGenerated === false && loading === false" @submit.prevent="generateTFA">
			<div class="title">
				{{ t('enter_password_to_enable_tfa') }}
			</div>
			<div>
				<v-input v-model="password" :nullable="false" type="password" :placeholder="t('password')" autofocus />

				<v-error v-if="error" :error="error" />
			</div>
			<v-button type="submit" :loading="loading">{{ t('next') }}</v-button>
		</form>

		<v-progress-circular v-else-if="loading === true" class="loader" indeterminate />

		<div v-show="tfaEnabled === false && tfaGenerated === true && loading === false">
			<form @submit.prevent="enable">
				<div class="title">
					{{ t('tfa_scan_code') }}
				</div>
				<div>
					<canvas :id="canvasID" class="qr" />
					<output class="secret selectable">{{ secret }}</output>
					<v-input ref="inputOTP" v-model="otp" type="text" :placeholder="t('otp')" :nullable="false" />
					<v-error v-if="error" :error="error" />
				</div>
				<v-button type="submit" :disabled="otp.length !== 6" @click="enable">{{ t('done') }}</v-button>
			</form>
		</div>

		<template #notice>
			<v-icon name="lock" left />
			{{ t('not_authenticated') }}
		</template>
	</public-view>
</template>

<style lang="scss" scoped>
h1 {
	margin-bottom: 20px;
}

.v-input,
.v-notice,
.v-error {
	margin-bottom: 20px;
}

.title {
	margin-bottom: 10px;
	font-weight: 600;
}

.qr {
	display: block;
	margin: 0 auto;
}

.secret {
	display: block;
	margin: 0 auto 16px;
	color: var(--theme--foreground-subdued);
	font-family: var(--theme--font-family-monospace);
	letter-spacing: 2.6px;
	text-align: center;
}
</style>
