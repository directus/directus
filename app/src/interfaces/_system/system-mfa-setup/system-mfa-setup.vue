<template>
	<div>
		<v-checkbox block :model-value="tfaEnabled" :disabled="!isCurrentUser && !tfaEnabled" @click="toggle">
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
						<v-input v-model="password" :nullable="false" type="password" :placeholder="t('password')" autofocus />

						<v-error v-if="error" :error="error" />
					</v-card-text>
					<v-card-actions>
						<v-button type="button" secondary @click="cancelAndClose">{{ t('cancel') }}</v-button>
						<v-button type="submit" :loading="loading">{{ t('next') }}</v-button>
					</v-card-actions>
				</form>

				<v-progress-circular v-else-if="loading === true" class="loader" indeterminate />

				<div v-show="tfaEnabled === false && tfaGenerated === true && loading === false">
					<form @submit.prevent="enable">
						<v-card-title>
							{{ t('tfa_scan_code') }}
						</v-card-title>
						<v-card-text>
							<canvas :id="canvasID" class="qr" />
							<output class="secret selectable">{{ secret }}</output>
							<v-input ref="inputOTP" v-model="otp" type="text" :placeholder="t('otp')" :nullable="false" />
							<v-error v-if="error" :error="error" />
						</v-card-text>
						<v-card-actions>
							<v-button type="button" secondary @click="cancelAndClose">{{ t('cancel') }}</v-button>
							<v-button type="submit" :disabled="otp.length !== 6" @click="enable">{{ t('done') }}</v-button>
						</v-card-actions>
					</form>
				</div>
			</v-card>
		</v-dialog>

		<v-dialog v-model="disableActive" persistent @esc="cancelAndClose">
			<v-card>
				<form v-if="isCurrentUser" @submit.prevent="disable">
					<v-card-title>
						{{ t('enter_otp_to_disable_tfa') }}
					</v-card-title>
					<v-card-text>
						<v-input v-model="otp" type="text" :placeholder="t('otp')" :nullable="false" autofocus />
						<v-error v-if="error" :error="error" />
					</v-card-text>
					<v-card-actions>
						<v-button type="button" secondary @click="cancelAndClose">{{ t('cancel') }}</v-button>
						<v-button type="submit" kind="danger" :loading="loading" :disabled="otp.length !== 6">
							{{ t('disable_tfa') }}
						</v-button>
					</v-card-actions>
				</form>
				<form v-else @submit.prevent="disable">
					<v-card-title>
						{{ t('disable_tfa') }}
					</v-card-title>
					<v-card-text>
						{{ t('admin_disable_tfa_text') }}
						<v-error v-if="error" :error="error" />
					</v-card-text>
					<v-card-actions>
						<v-button type="button" secondary @click="cancelAndClose">{{ t('cancel') }}</v-button>
						<v-button type="submit" kind="danger" :loading="loading">
							{{ t('disable_tfa') }}
						</v-button>
					</v-card-actions>
				</form>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup lang="ts">
import { useTFASetup } from '@/composables/use-tfa-setup';
import { useUserStore } from '@/stores/user';
import { User } from '@directus/types';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	value: string | null;
	primaryKey?: string;
}>();

const { t } = useI18n();

const userStore = useUserStore();
const enableActive = ref(false);
const disableActive = ref(false);

const inputOTP = ref<any>(null);

const isCurrentUser = computed(() => (userStore.currentUser as User)?.id === props.primaryKey);

const {
	generateTFA,
	enableTFA,
	disableTFA,
	adminDisableTFA,
	loading,
	password,
	tfaEnabled,
	tfaGenerated,
	secret,
	otp,
	error,
	canvasID,
} = useTFASetup(!!props.value);

watch(
	() => props.value,
	() => {
		tfaEnabled.value = !!props.value;
	},
	{ immediate: true }
);

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
	const success = await enableTFA();
	enableActive.value = !success;

	if (!success) {
		(inputOTP.value.$el as HTMLElement).querySelector('input')!.focus();
	}
}

async function disable() {
	const success = await (isCurrentUser.value ? disableTFA() : adminDisableTFA(props.primaryKey!));
	disableActive.value = !success;
}

function toggle() {
	if (tfaEnabled.value === false) {
		enableActive.value = true;
	} else {
		disableActive.value = true;
	}
}

function cancelAndClose() {
	tfaGenerated.value = false;
	enableActive.value = false;
	disableActive.value = false;
	password.value = '';
	otp.value = '';
	secret.value = '';
	error.value = null;
}
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
