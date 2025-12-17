<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	inheritAttrs: false,
});
</script>

<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	value: string | null;
	disabled?: boolean;
	nonEditable?: boolean;
	placeholder?: string;
	masked?: boolean;
	autocomplete?: string;
}>();

const emit = defineEmits(['input']);

const { t } = useI18n();

const isHashed = ref(false);
const localValue = ref<string | null>(null);

const autocomplete = computed(() => {
	if (props.autocomplete) return props.autocomplete;

	if (props.masked) return 'new-password';

	return 'off';
});

const internalPlaceholder = computed(() => {
	return isHashed.value ? t('value_securely_stored') : props.placeholder;
});

watch(
	() => props.value,
	() => {
		isHashed.value = !!(props.value && props.value.length > 0);
	},
	{ immediate: true },
);

function emitValue(newValue: string) {
	emit('input', newValue);
	localValue.value = newValue;
}
</script>

<template>
	<v-input
		:placeholder="internalPlaceholder"
		:disabled
		:non-editable
		:type="masked ? 'password' : 'text'"
		:autocomplete
		:model-value="localValue"
		:class="{ hashed: isHashed && !localValue }"
		@update:model-value="emitValue"
	>
		<template #append>
			<v-icon class="lock" :name="isHashed && !localValue ? 'lock' : 'lock_open'" />
		</template>
	</v-input>
</template>

<style lang="scss" scoped>
.v-input {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
	--v-icon-color: var(--theme--warning);

	&.hashed {
		--v-icon-color: var(--theme--primary);
	}
}

.lock {
	--v-icon-color: var(--theme--warning);
}

.hashed {
	--v-input-placeholder-color: var(--theme--primary);
}

.hashed .lock {
	--v-icon-color: var(--theme--primary);
}
</style>
