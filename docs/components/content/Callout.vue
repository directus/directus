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
			<!-- <Badge small :text="`Click to ${detailsOpen ? 'close' : 'open'}`" /> -->
			<Icon name="material-symbols:keyboard-arrow-down-rounded" :class="{ toggle: true, open: detailsOpen }" />
		</summary>
		<ContentSlot :use="$slots.default" />
	</details>

	<!-- STATIC -->
	<component :is="componentType()" v-else :href="url" class="callout" :class="type" :style="`border-color: ${section.color};`">
		<Icon :name="section.icon" :color="section.color" class="icon main" />
		<div class="content">
			<p v-if="title" class="title"><b>{{ title }}</b></p>
			<ContentSlot :use="$slots.default" />
		</div>
		<!-- TODO: FIX ARROW ON LINK -->
		<Icon v-if="componentType == 'a' || componentType().name == 'NuxtLink'" class="arrow" name="material-symbols:arrow-forward-ios-rounded" :color="section.color"  />
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
	&:after {
		display: none !important;
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
		margin-top: 5px;
	}
}

.icon.main {
	margin-top: 4px;
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
	.toggle {
		&.open {
			transform: rotate(180deg);
		}
	}
}

.content {
	width: 100%;
	:deep(p) {
		margin-bottom: 0.5rem;
	}

	:deep(> *:last-child) {
		margin-bottom: 0;
	}

	:deep(ul),
	:deep(ol) {
		padding-left: 1.25rem;
	}
}
</style>
