<script setup lang="ts">
import { useTFASetup } from '@/composables/use-tfa-setup';
import { useUserStore } from '@/stores/user';
import { User } from '@directus/types';
import { computed, inject, nextTick, ref, watch } from 'vue';
import { DEFAULT_AUTH_DRIVER } from '@/constants';

const props = defineProps<{
	value: string | null;
	primaryKey?: string;
	disabled?: boolean;
}>();

const userStore = useUserStore();
const enableActive = ref(false);
const disableActive = ref(false);
const cancelSetupActive = ref(false);

const inputOTP = ref<any>(null);

const isCurrentUser = computed(() => (userStore.currentUser as User)?.id === props.primaryKey);

// Get the user data from the parent context
const values = inject('values', ref<Record<string, any>>({}));

const profileUser = computed(() => {
	// If we have values and they contain user data, use that
	if (values.value && Object.keys(values.value).length > 0) {
		return values.value as User;
	}

	return null;
});

// Detect if the user being viewed is an SSO user
const isSSOUser = computed(() => {
	// Use profile user data when viewing a different user, otherwise use current user
	const user = profileUser.value && !isCurrentUser.value ? profileUser.value : userStore.currentUser;
	return user && !('share' in user) && user.provider !== DEFAULT_AUTH_DRIVER;
});

const effectiveTFAEnabled = computed(() => {
	if (profileUser.value && !isCurrentUser.value) {
		// OAuth users
		if (profileUser.value.provider !== DEFAULT_AUTH_DRIVER) {
			return !!(profileUser.value.tfa_secret || requireTfaSetup.value === profileUser.value.id);
		}

		// Password users
		return !!profileUser.value.tfa_secret;
	}

	if (isCurrentUser.value) {
		const user = userStore.currentUser as User;
		if (!user || 'share' in user) return !!props.value;

		// OAuth users
		if (user.provider !== DEFAULT_AUTH_DRIVER) {
			return !!(user.tfa_secret || requireTfaSetup.value === user.id);
		}

		// Password users
		return !!user.tfa_secret;
	}

	// if no profile user data and not viewing current user, use props.value
	return !!props.value;
});

const {
	generateTFA,
	enableTFA,
	disableTFA,
	adminDisableTFA,
	requestTFASetup,
	cancelTFASetup,
	loading,
	password,
	tfaEnabled,
	tfaGenerated,
	secret,
	otp,
	error,
	canvasID,
	requireTfaSetup,
} = useTFASetup(!!props.value);

// Inject the discard functionality from the parent form
const discardAllChanges = inject<(() => void) | null>('discardAllChanges', null);

// Add a method to trigger discard all changes
function triggerDiscardAllChanges() {
	if (discardAllChanges) {
		discardAllChanges();
	}
}

watch(
	() => effectiveTFAEnabled.value,
	() => {
		tfaEnabled.value = effectiveTFAEnabled.value;
	},
	{ immediate: true },
);

watch(
	() => tfaGenerated.value,
	async (generated) => {
		if (generated) {
			await nextTick();
			(inputOTP.value.$el as HTMLElement).querySelector('input')!.focus();
		}
	},
);

async function enable() {
	const success = await enableTFA();
	enableActive.value = !success;

	if (!success) {
		(inputOTP.value.$el as HTMLElement).querySelector('input')!.focus();
	}
}

async function enableSSO() {
	triggerDiscardAllChanges();
	const success = await requestTFASetup();
	enableActive.value = !success;
}

async function disable() {
	const success = await (isCurrentUser.value ? disableTFA() : adminDisableTFA(props.primaryKey!));
	disableActive.value = !success;
}

async function cancelSetup() {
	const success = await cancelTFASetup();
	cancelSetupActive.value = !success;
}

async function generateForPasswordUser() {
	// For password users, we always require password
	await generateTFA(true);
}

function toggle() {
	if (tfaEnabled.value === false) {
		enableActive.value = true;
	} else {
		// For SSO users, check if they have a pending TFA setup request in localStorage
		// Use profile user data when viewing a different user, otherwise use current user
		const userToCheck = profileUser.value && !isCurrentUser.value ? profileUser.value : userStore.currentUser;

		if (isSSOUser.value && requireTfaSetup.value === (userToCheck as any)?.id && !(userToCheck as any)?.tfa_secret) {
			cancelSetupActive.value = true;
		} else {
			disableActive.value = true;
		}
	}
}

function cancelAndClose() {
	tfaGenerated.value = false;
	enableActive.value = false;
	disableActive.value = false;
	cancelSetupActive.value = false;
	password.value = '';
	otp.value = '';
	secret.value = '';
	error.value = null;
}
</script>

<template>
	<div>
		<v-checkbox block :model-value="tfaEnabled" :disabled="disabled || (!isCurrentUser && !tfaEnabled)" @click="toggle">
			{{ tfaEnabled ? $t('enabled') : $t('disabled') }}
			<div class="spacer" />
			<template #append>
				<v-icon name="launch" class="checkbox-icon" :class="{ enabled: tfaEnabled }" />
			</template>
		</v-checkbox>

		<v-dialog v-model="enableActive" persistent @esc="cancelAndClose">
			<v-card>
				<!-- SSO user flow -->
				<div v-if="isSSOUser && tfaEnabled === false && tfaGenerated === false && loading === false">
					<v-card-title>
						{{ $t('enable_tfa') }}
					</v-card-title>
					<v-card-text>
						<p>{{ $t('sso_tfa_setup_notice') }}</p>
						<v-error v-if="error" :error="error" />
					</v-card-text>
					<v-card-actions>
						<v-button type="button" secondary @click="cancelAndClose">{{ $t('cancel') }}</v-button>
						<v-button type="submit" :loading="loading" @click="enableSSO">{{ $t('enable_tfa') }}</v-button>
					</v-card-actions>
				</div>

				<!-- Password user flow -->
				<form
					v-else-if="!isSSOUser && tfaEnabled === false && tfaGenerated === false && loading === false"
					@submit.prevent="generateForPasswordUser"
				>
					<v-card-title>
						{{ $t('enter_password_to_enable_tfa') }}
					</v-card-title>
					<v-card-text>
						<v-input v-model="password" :nullable="false" type="password" :placeholder="$t('password')" autofocus />

						<v-error v-if="error" :error="error" />
					</v-card-text>
					<v-card-actions>
						<v-button type="button" secondary @click="cancelAndClose">{{ $t('cancel') }}</v-button>
						<v-button type="submit" :loading="loading">{{ $t('next') }}</v-button>
					</v-card-actions>
				</form>

				<v-progress-circular v-else-if="loading === true" class="loader" indeterminate />

				<div v-show="tfaEnabled === false && tfaGenerated === true && loading === false">
					<form @submit.prevent="enable">
						<v-card-title>
							{{ $t('tfa_scan_code') }}
						</v-card-title>
						<v-card-text>
							<canvas :id="canvasID" class="qr" />
							<output class="secret">{{ secret }}</output>
							<v-input ref="inputOTP" v-model="otp" type="text" :placeholder="$t('otp')" :nullable="false" />
							<v-error v-if="error" :error="error" />
						</v-card-text>
						<v-card-actions>
							<v-button type="button" secondary @click="cancelAndClose">{{ $t('cancel') }}</v-button>
							<v-button type="submit" :disabled="otp.length !== 6" @click="enable">{{ $t('done') }}</v-button>
						</v-card-actions>
					</form>
				</div>
			</v-card>
		</v-dialog>

		<v-dialog v-model="disableActive" persistent @esc="cancelAndClose">
			<v-card>
				<form v-if="isCurrentUser" @submit.prevent="disable">
					<v-card-title>
						{{ $t('enter_otp_to_disable_tfa') }}
					</v-card-title>
					<v-card-text>
						<v-input v-model="otp" type="text" :placeholder="$t('otp')" :nullable="false" autofocus />
						<v-error v-if="error" :error="error" />
					</v-card-text>
					<v-card-actions>
						<v-button type="button" secondary @click="cancelAndClose">{{ $t('cancel') }}</v-button>
						<v-button type="submit" kind="danger" :loading="loading" :disabled="otp.length !== 6">
							{{ $t('disable_tfa') }}
						</v-button>
					</v-card-actions>
				</form>
				<form v-else @submit.prevent="disable">
					<v-card-title>
						{{ $t('disable_tfa') }}
					</v-card-title>
					<v-card-text>
						{{ $t('admin_disable_tfa_text') }}
						<v-error v-if="error" :error="error" />
					</v-card-text>
					<v-card-actions>
						<v-button type="button" secondary @click="cancelAndClose">{{ $t('cancel') }}</v-button>
						<v-button type="submit" kind="danger" :loading="loading">
							{{ $t('disable_tfa') }}
						</v-button>
					</v-card-actions>
				</form>
			</v-card>
		</v-dialog>

		<v-dialog v-model="cancelSetupActive" persistent @esc="cancelAndClose">
			<v-card>
				<v-card-title>
					{{ $t('cancel_tfa_setup') }}
				</v-card-title>
				<v-card-text>
					<p>{{ $t('cancel_tfa_setup_notice') }}</p>
					<v-error v-if="error" :error="error" />
				</v-card-text>
				<v-card-actions>
					<v-button type="button" secondary @click="cancelAndClose">{{ $t('keep_setup') }}</v-button>
					<v-button type="submit" :loading="loading" @click="cancelSetup">{{ $t('cancel_setup') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style lang="scss" scoped>
.checkbox-icon {
	--v-icon-color: var(--theme--form--field--input--foreground-subdued);

	&.enabled {
		--v-icon-color: var(--theme--primary);
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
	color: var(--theme--form--field--input--foreground-subdued);
	font-family: var(--theme--fonts--monospace--font-family);
	letter-spacing: 2.6px;
	text-align: center;
}

.v-error {
	margin-block-start: 24px;
}
</style>
