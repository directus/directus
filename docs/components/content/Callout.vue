<script setup>
const props = defineProps({
	title: String,
	url: String,
	toggleable: Boolean,
	type: {
		type: String,
		default: 'info'	// warning | link | user-guide | dev-docs | api-ref | tutorials
	},
})

const componentType = props.url ? 'a' : 'div'
</script>

<template>
	<details v-if="toggleable">
		<summary>{{ title }}</summary>
		<ContentSlot :use="$slots.default" />
	</details>
	<component :is="componentType" v-else :href="url" class="callout">
		<p>{{ type }} <b>{{ title }}</b></p>
		<ContentSlot :use="$slots.default" />
	</component>
</template>

<style scoped>
.callout {
	display: block;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	padding: 1rem;
	border-radius: 8px;
	text-decoration: none;
	color: inherit;
}

a.callout {
	border-style: dashed;
}

a.callout:hover {
	border-style: solid;
	border-color: #6644ff;
	cursor: pointer;
}
</style>
