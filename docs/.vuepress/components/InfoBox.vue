<template>
    <article class="info-box">
        <div class="header">{{ title }}</div>
        <div class="body">
            <slot />
        </div>
    </article>
</template>

<script>
export default {
    props: ['title']
}
</script>

<style scoped>
.info-box {
	position: relative;
	width: 100%;
	overflow: hidden;
	border: 2px solid #f0f4f9;
	border-radius: 6px;
}

.header {
	padding: 8px;
	font-weight: 600;
	font-size: 0.8em;
	text-transform: uppercase;
	background-color: #f0f4f9;
}

.body ::v-deep pre {
	margin: 0;
	padding: 20px;
	overflow: auto;
	color: white;
	font-size: 0.8em;
	border-radius: 0;
}
</style>