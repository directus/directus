<template>
	<v-input
		:placeholder="_placeholder"
		:disabled="disabled"
		:type="masked ? 'password' : 'text'"
		:value="localValue"
		@input="emitValue"
		:class="{ hashed: isHashed && !localValue }"
	>
		<template #append>
			<v-icon class="lock" :name="isHashed && !localValue ? 'lock' : 'lock_open'" />
		</template>
	</v-input>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, watch } from '@vue/composition-api';
import i18n from '@/lang';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
		masked: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const isHashed = ref(false);
		const localValue = ref<string | null>(null);

		const _placeholder = computed(() => {
			return isHashed.value ? i18n.t('value_hashed') : props.placeholder;
		});

		watch(() => props.value, () => {
			isHashed.value = !!(props.value && props.value.length > 0);
		}, { immediate: true });

		return { _placeholder, isHashed, localValue, emitValue };

		function emitValue(newValue: string) {
			emit('input', newValue);
			localValue.value = newValue;
		}
	},
});
</script>

<style lang="scss" scoped>
.v-input {
	--v-input-font-family: var(--family-monospace);
	--v-icon-color: var(--warning);

	&.hashed {
		--v-icon-color: var(--primary);
	}
}

.lock {
	--v-icon-color: var(--warning);
}

.hashed {
	--v-input-placeholder-color: var(--primary);
}

.hashed .lock {
	--v-icon-color: var(--primary);
}
</style>
