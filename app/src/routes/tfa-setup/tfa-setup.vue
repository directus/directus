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
				<v-input v-model="password" :nullable="false" type="password" :placeholder="t('password')" />

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
					<v-input v-model="otp" type="text" :placeholder="t('otp')" :nullable="false" />
					<v-error v-if="error" :error="error" />
				</div>
				<v-button type="submit" :disabled="otp.length !== 6" @click="enable">{{ t('done') }}</v-button>
			</form>
		</div>

		<template #notice>
			<v-icon name="lock_outlined" left />
			{{ t('not_authenticated') }}
		</template>
	</public-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, onMounted } from 'vue';
import { useTFASetup } from '@/composables/use-tfa-setup';
import { useAppStore, useUserStore } from '@/stores';
import { router } from '@/router';

export default defineComponent({
	setup() {
		const { t } = useI18n();
		const appStore = useAppStore();
		const userStore = useUserStore();

		onMounted(() => {
			if (appStore.authenticated === false) {
				router.push('/login');
			}
		});

		const { generateTFA, enableTFA, loading, password, tfaEnabled, tfaGenerated, secret, otp, error, canvasID } =
			useTFASetup(false);

		return {
			t,
			generateTFA,
			enableTFA,
			loading,
			password,
			tfaEnabled,
			tfaGenerated,
			secret,
			otp,
			error,
			canvasID,
			enable,
		};

		async function enable() {
			await enableTFA();
			if (error.value === null) {
				router.push(userStore.currentUser?.last_page || '/login');
			}
		}
	},
});
</script>

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
	color: var(--foreground-subdued);
	font-family: var(--family-monospace);
	letter-spacing: 2.6px;
	text-align: center;
}
</style>
