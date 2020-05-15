<template>
	<v-notice v-if="!statuses">
		{{ $t('statuses_not_configured') }}
	</v-notice>
	<v-menu v-else attached :disabled="disabled" close-on-content-click>
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
								? { backgroundColor: current.background_color }
								: { backgroundColor: 'var(--border-normal)' }
						"
					/>
				</template>
				<template #append><v-icon name="expand_more" :class="{ active }" /></template>
			</v-input>
		</template>

		<v-list dense>
			<v-list-item
				v-for="status in statuses"
				:key="status.value"
				:active="status.value === value"
				@click="$emit('input', status.value)"
			>
				<v-list-item-icon>
					<div class="status-dot" :style="{ backgroundColor: status.color }" />
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
		status_mapping: {
			type: Object,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const statuses = computed(() => {
			if (props.status_mapping === null) return null;

			return Object.keys(props.status_mapping).map((key: string) => {
				const status = props.status_mapping[key];

				return {
					value: key,
					name: status.name,
					color: status.background_color,
				};
			});
		});

		const current = computed(() => {
			if (props.value === null) return null;
			if (props.status_mapping.hasOwnProperty(props.value) === false) return null;

			return props.status_mapping[props.value] || null;
		});

		return { statuses, current };
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
