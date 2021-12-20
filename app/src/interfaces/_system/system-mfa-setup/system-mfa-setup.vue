<template>
	<div>
		<v-checkbox block :model-value="tfaEnabled" :disabled="!isCurrentUser" @click="toggle">
			{{ tfaEnabled ? t('enabled') : t('disabled') }}
			<div class="spacer" />
			<template #append>
				<v-icon name="launch" class="checkbox-icon" :class="{ enabled: tfaEnabled }" />
			</template>
		</v-checkbox>

		<v-dialog v-model="enableActive" persistent @esc="cancelAndClose">
			<v-card>
				<form v-if="tfaEnabled === false && tfaGenerated === false && loading === false" @submit.prevent="generateTFA">
					<v-card-title>
						{{ t('enter_password_to_enable_tfa') }}
					</v-card-title>
					<v-card-text>
						<v-input v-model="password" :nullable="false" type="password" :placeholder="t('password')" />

						<v-error v-if="error" :error="error" />
					</v-card-text>
					<v-card-actions>
						<v-button type="button" secondary @click="cancelAndClose">{{ t('cancel') }}</v-button>
						<v-button type="submit" :loading="loading">{{ t('next') }}</v-button>
					</v-card-actions>
				</form>

				<v-progress-circular v-else-if="loading === true" class="loader" indeterminate />

				<div v-show="tfaEnabled === false && tfaGenerated === true && loading === false">
					<form @submit.prevent="enableTFA">
						<v-card-title>
							{{ t('tfa_scan_code') }}
						</v-card-title>
						<v-card-text>
							<canvas :id="canvasID" class="qr" />
							<output class="secret selectable">{{ secret }}</output>
							<v-input v-model="otp" type="text" :placeholder="t('otp')" :nullable="false" />
							<v-error v-if="error" :error="error" />
						</v-card-text>
						<v-card-actions>
							<v-button type="button" secondary @click="cancelAndClose">{{ t('cancel') }}</v-button>
							<v-button type="submit" :disabled="otp.length !== 6" @click="enableTFA">{{ t('done') }}</v-button>
						</v-card-actions>
					</form>
				</div>
			</v-card>
		</v-dialog>

		<v-dialog v-model="disableActive" @esc="disableActive = false">
			<v-card>
				<form @submit.prevent="disableTFA">
					<v-card-title>
						{{ t('enter_otp_to_disable_tfa') }}
					</v-card-title>
					<v-card-text>
						<v-input v-model="otp" type="text" :placeholder="t('otp')" :nullable="false" />
						<v-error v-if="error" :error="error" />
					</v-card-text>
					<v-card-actions>
						<v-button type="submit" kind="warning" :loading="loading" :disabled="otp.length !== 6">
							{{ t('disable_tfa') }}
						</v-button>
					</v-card-actions>
				</form>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, watch, onMounted, computed } from 'vue';
import api from '@/api';
import qrcode from 'qrcode';
import { nanoid } from 'nanoid';
import { useUserStore } from '@/stores';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		primaryKey: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const userStore = useUserStore();
		const tfaEnabled = ref(!!props.value);
		const tfaGenerated = ref(false);
		const enableActive = ref(false);
		const disableActive = ref(false);
		const loading = ref(false);
		const canvasID = nanoid();
		const secret = ref<string>();
		const otp = ref('');
		const error = ref<any>();
		const password = ref('');

		onMounted(() => {
			password.value = '';
		});

		watch(
			() => props.value,
			() => {
				tfaEnabled.value = !!props.value;
			},
			{ immediate: true }
		);
		const isCurrentUser = computed(() => userStore.currentUser?.id === props.primaryKey);

		return {
			t,
			tfaEnabled,
			tfaGenerated,
			generateTFA,
			cancelAndClose,
			enableTFA,
			toggle,
			password,
			enableActive,
			disableActive,
			loading,
			canvasID,
			secret,
			disableTFA,
			otp,
			error,
			isCurrentUser,
		};

		function toggle() {
			if (tfaEnabled.value === false) {
				enableActive.value = true;
			} else {
				disableActive.value = true;
			}
		}

		async function generateTFA() {
			if (loading.value === true) return;

			loading.value = true;

			try {
				const response = await api.post('/users/me/tfa/generate', { password: password.value });
				const url = response.data.data.otpauth_url;
				secret.value = response.data.data.secret;
				await qrcode.toCanvas(document.getElementById(canvasID), url);
				tfaGenerated.value = true;
				error.value = null;
			} catch (err: any) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}

		function cancelAndClose() {
			tfaGenerated.value = false;
			enableActive.value = false;
			password.value = '';
			otp.value = '';
			secret.value = '';
		}

		async function enableTFA() {
			if (loading.value === true) return;

			loading.value = true;

			try {
				await api.post('/users/me/tfa/enable', { otp: otp.value, secret: secret.value });
				tfaEnabled.value = true;
				tfaGenerated.value = false;
				enableActive.value = false;
				password.value = '';
				otp.value = '';
				secret.value = '';
				error.value = null;
			} catch (err: any) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}

		async function disableTFA() {
			loading.value = true;

			try {
				await api.post('/users/me/tfa/disable', { otp: otp.value });

				tfaEnabled.value = false;
				disableActive.value = false;
				otp.value = '';
			} catch (err: any) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.checkbox-icon {
	--v-icon-color: var(--foreground-subdued);

	&.enabled {
		--v-icon-color: var(--primary);
	}
}

.loader {
	margin: 100px auto;
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

.v-error {
	margin-top: 24px;
}
</style>
