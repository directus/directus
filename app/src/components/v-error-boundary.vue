<script setup lang="ts">
import { getVueComponentName } from '@/utils/get-vue-component-name';
import { kebabCase } from 'lodash';
import { computed, onErrorCaptured, ref } from 'vue';

interface Props {
	/** Unique name to identify component wrapped by this error boundary */
	name?: string;
	/** Stops propagating the error to the parent */
	stopPropagation?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	name: undefined,
	stopPropagation: true,
});

const error = ref<Error | null>(null);

const hasError = computed(() => !!error.value);

onErrorCaptured((err, vm, info) => {
	error.value = err;
	const source = props.name ? kebabCase(props.name) : getVueComponentName(vm);
	// eslint-disable-next-line no-console
	console.warn(`[${source}-error] ${info}`);
	// eslint-disable-next-line no-console
	console.warn(err);
	if (props.stopPropagation) return false;
});
</script>

<template>
	<template v-if="hasError">
		<template v-if="$slots.fallback">
			<slot name="fallback" v-bind="{ error }" />
		</template>
	</template>
	<slot v-else></slot>
</template>
