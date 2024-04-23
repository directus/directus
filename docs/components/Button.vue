<script setup>
const props = defineProps({
	type: {
		type: String,
		default: 'button',
		validator(value) {
			return ['a', 'button', 'submit', 'reset', 'span'].includes(value)
		}
	},
	label: {
		type: String,
		required: true
	},
	color: {
		type: String,
		default: 'primary',
		validator(value) {
			return ['primary', 'white', 'outline-only'].includes(value)
		}
	},
	size: {
		type: String,
		default: 'medium',
		validator(value) {
			return ['small', 'medium'].includes(value)
		}
	},
	href: {
		type: String
	},
	target: {
		type: String,
		validator(value) {
			return ['_blank', '_self', '_parent', '_top'].includes(value)
		}
	}
})

const buttonProps = computed(() => {
	if (props.href) {
		return {
			href: props.href,
			target: props.target,
		}
	}

	return {}
})
</script>

<template>
	<component :is="type" v-bind="buttonProps" :class="['button', `size-${size}`, `color-${color}`]">{{ label }}</component>
</template>

<style scoped lang="scss">
.button {
	display: inline-block;
	text-decoration: none;
	border-radius: var(--border-radius);
	border: 1px solid transparent;
	font-weight: 500;
}
.size-small {
	font-size: 14px;
	padding: 0.2rem 0.6rem;
}
.size-medium {
	font-size: 1rem;
	padding: 0.25rem 0.75rem;
}
.color-primary {
	background: var(--primary);
	color: white;
	border-color: var(--primary--dark);
	&:hover {
		background: var(--primary--dark);
	}
}
.color-white {
	background: white;
	color: var(--typography-1);
	border-color: var(--border-2);
	&:hover {
		background: var(--border-2);
	}
}
.color-outline-only {
	border-color: var(--border-2);
	&:hover {
		border-color: var(--border-3);
	}
}
</style>
