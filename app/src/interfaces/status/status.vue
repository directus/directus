<template>
	<v-notice v-if="!statuses">
		{{ $t('statuses_not_configured') }}
	</v-notice>
	<v-menu v-else attached :disabled="disabled">
		<template #activator="{ toggle, active }">
			<v-input
				readonly
				@click="toggle"
				:value="current ? current.name : null"
				:placeholder="$t('choose_status')"
				:disabled="disabled"
			>
				<template #prepend>
					<div
						class="status-dot"
						:style="
							current
								? { backgroundColor: current.backgroundColor }
								: { backgroundColor: 'var(--border-normal)' }
						"
					/>
				</template>
				<template #append><v-icon name="expand_more" :class="{ active }" /></template>
			</v-input>
		</template>

		<v-list dense>
			<v-list-item
				v-for="(status, key) in statuses"
				:key="key"
				:active="key === value"
				@click="$emit('input', key)"
			>
				<v-list-item-icon>
					<div class="status-dot" :style="{ backgroundColor: status.backgroundColor }" />
				</v-list-item-icon>
				<v-list-item-content>{{ status.name }}</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		statuses: {
			type: Object,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const current = computed(() => {
			if (props.value === null) return null;
			if (props.statuses.hasOwnProperty(props.value) === false) return null;

			return props.statuses[props.value] || null;
		});

		return { current };
	},
});
</script>

<style lang="scss" scoped>
.v-input {
	.v-icon {
		transition: transform var(--medium) var(--transition-out);

		&.active {
			transform: scaleY(-1);
			transition-timing-function: var(--transition-in);
		}
	}
}

.status-dot {
	width: 14px;
	height: 14px;
	border: 2px solid var(--background-page);
	border-radius: 7px;
}

.v-list {
	.status-dot {
		border: 2px solid var(--background-subdued);
	}
}
</style>
