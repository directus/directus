<script setup>
defineProps({
    content: {
		type: String,
        required: true
    }
});
</script>

<template>
    <div class="prose">
        <ContentQuery v-slot="{ data }" :path="`/_partials/${content}`" find="one">
            <ContentRenderer :value="data" />
        </ContentQuery>
    </div>
</template>

<style scoped>
.prose {
	margin-bottom: 1rem;
}
</style>
