<script setup lang="ts">
import { getEndpoint } from '@directus/utils';
import { computed, inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VError from '@/components/v-error.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import { useClipboard } from '@/composables/use-clipboard';

const props = withDefaults(
	defineProps<{
		value?: string | null;
		disabled?: boolean;
		primaryKey?: string | number;
		collection?: string;
	}>(),
	{
		value: null,
	},
);

const { t } = useI18n();
const { isCopySupported, copyToClipboard } = useClipboard();
const refresh = inject<(() => void) | null>('refresh', null);

const localValue = ref<string | null>(null);
const loading = ref(false);
const confirmRegenerate = ref(false);
const confirmRemove = ref(false);
const tokenSavedInline = ref(false);
const generateError = ref<unknown>(null);
const regenerateError = ref<unknown>(null);
const removeError = ref<unknown>(null);
const regexp = new RegExp('^[*]+$');

const isNewUser = computed(() => props.primaryKey === '+' || props.primaryKey === undefined);
const hasPersistedToken = computed(() => !!props.value && regexp.test(props.value));
const hasToken = computed(() => hasPersistedToken.value || !!localValue.value);
const fieldDisabled = computed(() => props.disabled || isNewUser.value);

const placeholder = computed(() => {
	if (fieldDisabled.value && !props.value) return null;
	return props.value ? t('interfaces.system-token.value_securely_saved') : t('interfaces.system-token.placeholder');
});

watch(
	() => props.value,
	(newValue) => {
		if (newValue && !regexp.test(newValue)) return;
		localValue.value = null;
		tokenSavedInline.value = false;
		generateError.value = null;
		regenerateError.value = null;
		removeError.value = null;
	},
	{ immediate: true },
);

async function persistToken(token: string | null) {
	await api.patch(`${getEndpoint(props.collection!)}/${props.primaryKey}`, { token });
}

function onGenerateOrRegenerate() {
	if (hasToken.value) {
		openRegenerateConfirm();
		return;
	}

	generateAndPersistToken('generate');
}

function onRemove() {
	if (hasToken.value) {
		openRemoveConfirm();
	}
}

function openRegenerateConfirm() {
	regenerateError.value = null;
	confirmRegenerate.value = true;
}

function closeRegenerateConfirm() {
	if (loading.value) return;
	confirmRegenerate.value = false;
	regenerateError.value = null;
}

async function confirmRegenerateToken() {
	await generateAndPersistToken('regenerate');
}

async function generateAndPersistToken(action: 'generate' | 'regenerate') {
	if (!props.primaryKey || !props.collection) return;

	loading.value = true;

	if (action === 'regenerate') regenerateError.value = null;
	else generateError.value = null;

	try {
		const response = await api.get('/utils/random/string');
		const token = response.data.data as string;
		await persistToken(token);
		localValue.value = token;
		tokenSavedInline.value = true;

		if (action === 'regenerate') {
			confirmRegenerate.value = false;
		}
	} catch (error) {
		if (action === 'regenerate') {
			regenerateError.value = error;
		} else {
			generateError.value = error;
		}
	} finally {
		loading.value = false;
	}
}

function openRemoveConfirm() {
	removeError.value = null;
	confirmRemove.value = true;
}

function closeRemoveConfirm() {
	if (loading.value) return;
	confirmRemove.value = false;
	removeError.value = null;
}

async function confirmRemoveToken() {
	if (!props.primaryKey || !props.collection) return;

	loading.value = true;
	removeError.value = null;

	try {
		await persistToken(null);
		confirmRemove.value = false;
		localValue.value = null;
		tokenSavedInline.value = false;
		refresh?.();
	} catch (error) {
		removeError.value = error;
	} finally {
		loading.value = false;
	}
}

function select(event: FocusEvent) {
	if (localValue.value) (event.target as HTMLInputElement | null)?.select();
}

function deselect() {
	window.getSelection()?.removeAllRanges();
}
</script>

<template>
	<div class="system-token">
		<VInput
			:model-value="localValue ?? undefined"
			:type="localValue ? 'text' : 'password'"
			:placeholder="placeholder ?? undefined"
			:disabled="fieldDisabled"
			readonly
			:class="{ saved: value && !localValue }"
			@focus="select"
			@blur="deselect"
		>
			<template #append>
				<VIcon
					v-if="localValue && isCopySupported"
					v-tooltip="$t('copy')"
					name="content_copy"
					clickable
					class="clipboard-icon"
					@click="copyToClipboard(localValue)"
				/>
				<VIcon
					v-if="!disabled && !isNewUser"
					v-tooltip="hasToken ? $t('interfaces.system-token.regenerate') : $t('interfaces.system-token.generate')"
					:name="hasToken ? 'refresh' : 'add'"
					class="regenerate-icon"
					clickable
					:disabled="loading"
					@click="onGenerateOrRegenerate"
				/>
				<VIcon
					v-if="!isNewUser"
					v-tooltip="!disabled && hasToken && $t('interfaces.system-token.remove_token')"
					:name="!disabled && hasToken ? 'clear' : 'vpn_key'"
					:class="{ 'clear-icon': !disabled && hasToken, 'default-icon': disabled && hasToken }"
					:clickable="!disabled && hasToken"
					:disabled="loading || !hasToken"
					@click="onRemove"
				/>
			</template>
		</VInput>

		<VNotice v-if="isNewUser">
			{{ $t('interfaces.system-token.new_user_disabled_notice') }}
		</VNotice>

		<VNotice v-else-if="tokenSavedInline && localValue">
			<p>{{ $t('interfaces.system-token.token_saved_notice') }}</p>
			<p>{{ $t('interfaces.system-token.token_saved_copy') }}</p>
		</VNotice>

		<VError v-else-if="generateError" :error="generateError" />

		<VDialog v-model="confirmRegenerate" persistent @esc="closeRegenerateConfirm">
			<VCard>
				<VCardTitle>{{ $t('interfaces.system-token.regenerate_confirm_title') }}</VCardTitle>
				<VCardText>
					{{ $t('interfaces.system-token.regenerate_confirm_body') }}
					<VError v-if="regenerateError" :error="regenerateError" />
				</VCardText>
				<VCardActions>
					<VButton secondary :disabled="loading" @click="closeRegenerateConfirm">
						{{ $t('cancel') }}
					</VButton>
					<VButton kind="danger" :loading="loading" @click="confirmRegenerateToken">
						{{ $t('interfaces.system-token.regenerate') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<VDialog v-model="confirmRemove" persistent @esc="closeRemoveConfirm">
			<VCard>
				<VCardTitle>{{ $t('interfaces.system-token.remove_confirm_title') }}</VCardTitle>
				<VCardText>
					{{ $t('interfaces.system-token.remove_confirm_body') }}
					<VError v-if="removeError" :error="removeError" />
				</VCardText>
				<VCardActions>
					<VButton secondary :disabled="loading" @click="closeRemoveConfirm">
						{{ $t('cancel') }}
					</VButton>
					<VButton kind="danger" :loading="loading" @click="confirmRemoveToken">
						{{ $t('interfaces.system-token.remove_token') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</div>
</template>

<style lang="scss" scoped>
.v-input {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
}

.saved {
	--v-input-placeholder-color: var(--theme--primary);
}

.v-notice {
	margin-block-start: 0.6875rem;
}

.clipboard-icon {
	margin-inline-end: 0.25rem;
}

.regenerate-icon {
	margin-inline-end: 0.25rem;
}

.clear-icon {
	--v-icon-color-hover: var(--theme--danger);
}

.default-icon {
	--v-icon-color: var(--theme--primary);
}

.v-error {
	margin-block-start: 0.6875rem;
}
</style>
