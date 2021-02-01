<template>
	<div class="definition-list">
		<slot />
	</div>
</template>

<style scoped>
.definition-list > *:last-child {
	padding-bottom: 1rem;
	border-bottom: 1px solid #eee;
}

.definition-list ::v-deep h4, .definition-list ::v-deep p {
	margin: 0;
}

.definition-list ::v-deep p {
	font-size: 14px;
}

.definition-list ::v-deep h4 {
	margin-top: 1rem;
	padding-top: 1rem;
	font-size: 0.8rem;
	font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
	border-top: 1px solid #eee;
}

.definition-list ::v-deep code {
	padding: 0;
	background-color: transparent;
}

.definition-list ::v-deep a {
	font-size: 0.8rem;
}
</style>