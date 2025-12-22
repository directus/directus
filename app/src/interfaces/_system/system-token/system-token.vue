<script setup lang="ts">
import api from '@/api';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import { useClipboard } from '@/composables/use-clipboard';
import { unexpectedError } from '@/utils/unexpected-error';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		value?: string | null;
		disabled?: boolean;
	}>(),
	{
		value: null,
	},
);

const emit = defineEmits(['input']);

const { t } = useI18n();
const { isCopySupported, copyToClipboard } = useClipboard();

const placeholder = computed(() => {
	if (props.disabled && !props.value) return null;
	return props.value ? t('interfaces.system-token.value_securely_saved') : t('interfaces.system-token.placeholder');
});

const localValue = ref<string | null>(null);
const loading = ref(false);
const isNewTokenGenerated = ref(false);
const regexp = new RegExp('^[*]+$');

watch(
	() => props.value,
	(newValue) => {
		if (!newValue) {
			localValue.value = null;
			return;
		}

		if (newValue && regexp.test(newValue)) {
			localValue.value = null;
			isNewTokenGenerated.value = false;
		}
	},
	{ immediate: true },
);

async function generateToken() {
	loading.value = true;

	try {
		const response = await api.get('/utils/random/string');
		emitValue(response.data.data);
		isNewTokenGenerated.value = true;
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

function emitValue(newValue: string | null) {
	emit('input', newValue);
	localValue.value = newValue;
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
			:model-value="localValue"
			:type="!isNewTokenGenerated ? 'password' : 'text'"
			:placeholder="placeholder"
			:disabled="disabled"
			readonly
			:class="{ saved: value && !localValue }"
			@update:model-value="emitValue"
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
					@click="copyToClipboard(value)"
				/>
				<VIcon
					v-if="!disabled"
					v-tooltip="value ? $t('interfaces.system-token.regenerate') : $t('interfaces.system-token.generate')"
					:name="value ? 'refresh' : 'add'"
					class="regenerate-icon"
					clickable
					:disabled="disabled || loading"
					@click="generateToken"
				/>
				<VIcon
					v-tooltip="!disabled && value && $t('interfaces.system-token.remove_token')"
					:name="!disabled && value ? 'clear' : 'vpn_key'"
					:class="{ 'clear-icon': !disabled && !!value, 'default-icon': disabled && value }"
					:clickable="!disabled && !!value"
					:disabled="loading || !value"
					@click="emitValue(null)"
				/>
			</template>
		</VInput>

		<VNotice v-if="isNewTokenGenerated && value">
			{{ $t('interfaces.system-token.generate_success_copy') }}
		</VNotice>
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
	margin-block-start: 12px;
}

.clipboard-icon {
	margin-inline-end: 4px;
}

.regenerate-icon {
	margin-inline-end: 4px;
}

.clear-icon {
	--v-icon-color-hover: var(--theme--danger);
}

.default-icon {
	--v-icon-color: var(--theme--primary);
}
</style>
