<script setup>
const props = defineProps({
	contributors: { type: String, required: true }
});
</script>

<template>
	<div v-if="contributors">
        <p>
            <b>Contributors:</b>
            <span>{{ contributors }}</span>
        </p>
    </div>
</template>

<style scoped>
p {
    border: 1px solid var(--vp-c-divider);
    padding: 1em;
    border-radius: 8px;
}
b {
    margin-right: 0.5em;
}
</style>
