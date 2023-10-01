<template>
	<div>Value: {{ value }}</div>
</template>

<script setup lang="ts">
/* eslint-disable no-console */
import { toRefs } from 'vue';

    interface Props {
        collection: string;
        field: string;
        type: string;
        value?: Record<string, any>[];
    }

    const props = withDefaults(defineProps<Props>(), {
        value: () => [],
    });

    console.log("MY val", props.value)

    // TODO get current user language


    const { value } = toRefs(props);
</script>
