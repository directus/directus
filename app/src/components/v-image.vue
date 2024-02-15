<script setup lang="ts">
import { useAttrs } from 'vue';

const attrs = useAttrs();
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	inheritAttrs: false,
});
</script>

<template>
	<img v-bind="attrs" />
</template>
