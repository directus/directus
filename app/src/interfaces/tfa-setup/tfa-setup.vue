<template>
	<div>
		<v-checkbox block :input-value="!!tfaEnabled" @click.native="toggle">
			{{ $t('enabled') }}
			<div class="spacer" />
			<template #append>
				<v-icon name="launch" class="checkbox-icon" :class="{ enabled: tfaEnabled }" />
			</template>
		</v-checkbox>

		<v-dialog persistent v-model="enableActive">
			<v-card>
				<v-progress-circular class="loader" indeterminate v-if="loading === true" />
				<template v-show="loading === false">
					<v-card-title>
						{{ $t('tfa_scan_code') }}
					</v-card-title>
					<v-card-text>
						<canvas class="qr" :id="canvasID" />
						<output class="secret">{{ secret }}</output>
					</v-card-text>
					<v-card-actions>
						<v-button @click="enableActive = false">{{ $t('done') }}</v-button>
					</v-card-actions>
				</template>
			</v-card>
		</v-dialog>

		<v-dialog v-model="disableActive">
			<v-card>
				<v-card-title>
					{{ $t('enter_otp_to_disable_tfa') }}
				</v-card-title>
				<v-card-text>
					<v-input type="text" :placeholder="$t('otp')" v-model="otp" />
				</v-card-text>
				<v-card-actions>
					<v-button class="disable" :loading="loading" @click="disableTFA" :disabled="otp.length !== 6">
						{{ $t('disable_tfa') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';
import api from '@/api';
import qrcode from 'qrcode';
import { nanoid } from 'nanoid';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const tfaEnabled = ref(!!props.value);
		const enableActive = ref(false);
		const disableActive = ref(false);
		const loading = ref(false);
		const canvasID = nanoid();
		const secret = ref<string>();
		const otp = ref('');
		const error = ref<any>();

		watch(
			() => props.value,
			() => {
				tfaEnabled.value = !!props.value;
			},
			{ immediate: true }
		);

		return { tfaEnabled, toggle, enableActive, disableActive, loading, canvasID, secret, disableTFA, otp, error };

		function toggle() {
			if (tfaEnabled.value === false) {
				enableActive.value = true;
				enableTFA();
			} else {
				disableActive.value = true;
			}
		}

		async function enableTFA() {
			loading.value = true;
			const response = await api.post('/users/me/tfa/enable');
			const url = response.data.data.otpauth_url;
			secret.value = response.data.data.secret;
			await qrcode.toCanvas(document.getElementById(canvasID), url);
			loading.value = false;
			tfaEnabled.value = true;
		}

		async function disableTFA() {
			loading.value = true;

			try {
				await api.post('/users/me/tfa/disable', { otp: otp.value });

				tfaEnabled.value = false;
				disableActive.value = false;
			} catch (err) {
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
	margin: 0 auto;
	color: var(--foreground-subdued);
	font-family: var(--family-monospace);
	letter-spacing: 2.6px;
	text-align: center;
}

.disable {
	--v-button-background-color: var(--warning);
	--v-button-background-color-hover: var(--warning-125);
}
</style>
