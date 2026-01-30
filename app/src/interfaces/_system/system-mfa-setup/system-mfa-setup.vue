<script setup lang="ts">
import { User } from '@directus/types';
import { computed, inject, nextTick, ref, watch } from 'vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VDialog from '@/components/v-dialog.vue';
import VError from '@/components/v-error.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useTFASetup } from '@/composables/use-tfa-setup';
import { DEFAULT_AUTH_DRIVER } from '@/constants';
import { useUserStore } from '@/stores/user';

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
		<VCheckbox block :model-value="tfaEnabled" :disabled="disabled || (!isCurrentUser && !tfaEnabled)" @click="toggle">
			{{ tfaEnabled ? $t('enabled') : $t('disabled') }}
			<div class="spacer" />
			<template #append>
				<VIcon name="launch" class="checkbox-icon" :class="{ enabled: tfaEnabled }" />
			</template>
		</VCheckbox>

		<VDialog v-model="enableActive" persistent @esc="cancelAndClose">
			<VCard>
				<!-- SSO user flow -->
				<div v-if="isSSOUser && tfaEnabled === false && tfaGenerated === false && loading === false">
					<VCardTitle>
						{{ $t('enable_tfa') }}
					</VCardTitle>
					<VCardText>
						<p>{{ $t('sso_tfa_setup_notice') }}</p>
						<VError v-if="error" :error="error" />
					</VCardText>
					<VCardActions>
						<VButton type="button" secondary @click="cancelAndClose">{{ $t('cancel') }}</VButton>
						<VButton type="submit" :loading="loading" @click="enableSSO">{{ $t('enable_tfa') }}</VButton>
					</VCardActions>
				</div>

				<!-- Password user flow -->
				<form
					v-else-if="!isSSOUser && tfaEnabled === false && tfaGenerated === false && loading === false"
					@submit.prevent="generateForPasswordUser"
				>
					<VCardTitle>
						{{ $t('enter_password_to_enable_tfa') }}
					</VCardTitle>
					<VCardText>
						<VInput v-model="password" :nullable="false" type="password" :placeholder="$t('password')" autofocus />

						<VError v-if="error" :error="error" />
					</VCardText>
					<VCardActions>
						<VButton type="button" secondary @click="cancelAndClose">{{ $t('cancel') }}</VButton>
						<VButton type="submit" :loading="loading">{{ $t('next') }}</VButton>
					</VCardActions>
				</form>

				<VProgressCircular v-else-if="loading === true" class="loader" indeterminate />

				<div v-show="tfaEnabled === false && tfaGenerated === true && loading === false">
					<form @submit.prevent="enable">
						<VCardTitle>
							{{ $t('tfa_scan_code') }}
						</VCardTitle>
						<VCardText>
							<canvas :id="canvasID" class="qr" />
							<output class="secret">{{ secret }}</output>
							<VInput ref="inputOTP" v-model="otp" type="text" :placeholder="$t('otp')" :nullable="false" />
							<VError v-if="error" :error="error" />
						</VCardText>
						<VCardActions>
							<VButton type="button" secondary @click="cancelAndClose">{{ $t('cancel') }}</VButton>
							<VButton type="submit" :disabled="otp.length !== 6" @click="enable">{{ $t('done') }}</VButton>
						</VCardActions>
					</form>
				</div>
			</VCard>
		</VDialog>

		<VDialog v-model="disableActive" persistent @esc="cancelAndClose">
			<VCard>
				<form v-if="isCurrentUser" @submit.prevent="disable">
					<VCardTitle>
						{{ $t('enter_otp_to_disable_tfa') }}
					</VCardTitle>
					<VCardText>
						<VInput v-model="otp" type="text" :placeholder="$t('otp')" :nullable="false" autofocus />
						<VError v-if="error" :error="error" />
					</VCardText>
					<VCardActions>
						<VButton type="button" secondary @click="cancelAndClose">{{ $t('cancel') }}</VButton>
						<VButton type="submit" kind="danger" :loading="loading" :disabled="otp.length !== 6">
							{{ $t('disable_tfa') }}
						</VButton>
					</VCardActions>
				</form>
				<form v-else @submit.prevent="disable">
					<VCardTitle>
						{{ $t('disable_tfa') }}
					</VCardTitle>
					<VCardText>
						{{ $t('admin_disable_tfa_text') }}
						<VError v-if="error" :error="error" />
					</VCardText>
					<VCardActions>
						<VButton type="button" secondary @click="cancelAndClose">{{ $t('cancel') }}</VButton>
						<VButton type="submit" kind="danger" :loading="loading">
							{{ $t('disable_tfa') }}
						</VButton>
					</VCardActions>
				</form>
			</VCard>
		</VDialog>

		<VDialog v-model="cancelSetupActive" persistent @esc="cancelAndClose">
			<VCard>
				<VCardTitle>
					{{ $t('cancel_tfa_setup') }}
				</VCardTitle>
				<VCardText>
					<p>{{ $t('cancel_tfa_setup_notice') }}</p>
					<VError v-if="error" :error="error" />
				</VCardText>
				<VCardActions>
					<VButton type="button" secondary @click="cancelAndClose">{{ $t('keep_setup') }}</VButton>
					<VButton type="submit" :loading="loading" @click="cancelSetup">{{ $t('cancel_setup') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
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
