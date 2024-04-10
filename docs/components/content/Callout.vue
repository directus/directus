<script setup>
import calloutDefinitions from '@/utils/calloutDefinitions'

const props = defineProps({
	title: String,
	url: String,
	toggleable: Boolean,
	type: {
		type: String,
		default: 'info',
		validator(value) {
			return calloutDefinitions.map(icon => icon.type).includes(value)
		}
	},
})

const section = calloutDefinitions.find(section => section.type == props.type)

function componentType() {
	if(props.url && props.url.charAt(0) == '/') return resolveComponent('NuxtLink')
	if(props.url) return 'a'
	else return 'div'
}

const detailsOpen = ref(false)
</script>

<template>
	<!-- TOGGLE -->
	<details v-if="toggleable" class="callout info" @toggle="detailsOpen = !detailsOpen">
		<summary>
			<span> {{ title }} </span>
			<Badge small :text="`Click to ${detailsOpen ? 'close' : 'open'}`" />
		</summary>
		<ContentSlot :use="$slots.default" />
	</details>

	<!-- STATIC -->
	<component :is="componentType()" v-else :href="url" class="callout" :class="type" :style="`border-color: ${section.color};`">
		<Icon :name="section.icon" :color="section.color" />
		<div class="content">
			<p v-if="title"><b>{{ title }}</b></p>
			<ContentSlot :use="$slots.default" />
		</div>
		<Icon v-if="componentType == 'a'" class="arrow" name="material-symbols:arrow-forward-ios-rounded" :color="section.color"  />
	</component>
</template>

<style scoped lang="scss">
.callout {
	display: block;
	background: var(--background--subdued);
	border: 1px solid var(--border-2);
	padding: 1rem;
	border-radius: var(--border-radius);
	text-decoration: none;
	color: inherit;
	display: grid;
	grid-template-columns: 2em auto;
	&.warning {
		background: var(--red--light-3)
	}
}

a.callout {
	background: transparent;
	grid-template-columns: 2em auto 2em;
	border-style: dashed;
	&:hover {
		border-style: solid;
		cursor: pointer;
	}
	.arrow {
		margin-left: auto;
	}
}

svg {
	margin-top: 2px;
}

details.callout {
	summary {
		cursor: pointer;
		font-weight: bold;
		display: flex;
		justify-content: space-between;
		align-items: center;
		&::marker {
			content: '';
		}
		&:deep(+ *) {
			margin-top: 1rem;
		}
	}
}

.content :deep(> *:last-child) {
	margin-bottom: 0;
}
</style>
~/utils/calloutDefinitions
