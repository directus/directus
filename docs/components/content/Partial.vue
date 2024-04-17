<script setup>
defineProps({
    content: {
		type: Object,
        required: true
    }
});
</script>

<template>
    <div>
        <ContentQuery v-slot="{ data }" :path="`/_partials/${content}`" find="one">
            <ContentRenderer :value="data" />
        </ContentQuery>
    </div>
</template>
