<template>
	<div class="system-token">
		<v-input
			:model-value="localValue"
			:type="!isNewTokenGenerated ? 'password' : 'text'"
			:placeholder="placeholder"
			:disabled="disabled"
			readonly
			:class="{ saved: value && !localValue }"
			@update:model-value="emitValue"
		>
			<template #append>
				<v-icon
					v-if="!disabled"
					v-tooltip="value ? t('interfaces.system-token.regenerate') : t('interfaces.system-token.generate')"
					:name="value ? 'refresh' : 'add'"
					class="regenerate-icon"
					clickable
					:disabled="disabled || loading"
					@click="generateToken"
				/>
				<v-icon
					v-tooltip="!disabled && value && t('interfaces.system-token.remove_token')"
					:name="!disabled && value ? 'clear' : 'vpn_key'"
					:class="{ 'clear-icon': !disabled && !!value, 'default-icon': disabled && value }"
					:clickable="!disabled && !!value"
					:disabled="loading || !value"
					@click="emitValue(null)"
				/>
			</template>
		</v-input>

		<v-notice v-if="isNewTokenGenerated && value" type="info">
			{{ t('interfaces.system-token.generate_success_copy') }}
		</v-notice>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

interface Props {
	value?: string | null;
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), { value: () => null, disabled: false });

const emit = defineEmits(['input']);

const { t } = useI18n();

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
	{ immediate: true }
);

async function generateToken() {
	loading.value = true;

	try {
		const response = await api.get('/utils/random/string');
		emitValue(response.data.data);
		isNewTokenGenerated.value = true;
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		loading.value = false;
	}
}

function emitValue(newValue: string | null) {
	emit('input', newValue);
	localValue.value = newValue;
}
</script>

<style lang="scss" scoped>
.v-input {
	--v-input-font-family: var(--family-monospace);
}

.saved {
	--v-input-placeholder-color: var(--primary);
}

.v-notice {
	margin-top: 12px;
}

.regenerate-icon {
	margin-right: 4px;
}

.clear-icon {
	--v-icon-color-hover: var(--danger);
}

.default-icon {
	--v-icon-color: var(--primary);
}
</style>
