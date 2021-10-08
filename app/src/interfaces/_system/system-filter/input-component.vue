<template>
	<v-icon
		v-if="type === 'boolean'"
		:name="value === null ? 'indeterminate_check_box' : value ? 'check_box' : 'check_box_outline_blank'"
		clickable
		class="preview"
		small
		@click="$emit('input', !value)"
	/>
	<input
		v-else-if="is === 'interface-input'"
		ref="inputEl"
		:type="type"
		:value="value"
		:style="{ width }"
		placeholder="--"
		@input="emitValue($event.target.value)"
	/>
	<v-menu v-else :close-on-content-click="false" :show-arrow="true" placement="bottom-start">
		<template #activator="{ toggle }">
			<v-icon
				v-if="type === 'geometry' || type === 'json'"
				class="preview"
				:name="type === 'json' ? 'integration_instructions' : 'map'"
				@click="toggle"
			/>
			<div v-else class="preview" @click="toggle">{{ displayValue }}</div>
		</template>
		<div class="input" :class="type">
			<component :is="is" class="input-component" small :type="type" :value="value" @input="emitValue($event)" />
		</div>
	</v-menu>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	props: {
		is: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
		value: {
			type: [String, Number, Object, Boolean, Array] as PropType<string | number | Record<string, any> | boolean>,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const inputEl = ref<HTMLElement>();
		const { t } = useI18n();

		const displayValue = computed(() => {
			if (props.value === null) return null;
			if (props.value === undefined) return null;

			if (typeof props.value === 'string' && props.value.length > 25) {
				return props.value.substring(0, 22) + '...';
			}

			return props.value;
		});

		const width = computed(() => {
			if (props.is === 'interface-input' && typeof props.value === 'string') {
				return (props.value?.length >= 3 ? props.value.length + 1 : 3) + 'ch';
			}

			return 3 + 'ch';
		});

		onMounted(() => {
			inputEl.value?.focus();
		});

		return { displayValue, width, t, emitValue, inputEl };

		function emitValue(val: unknown) {
			if (val === '') {
				emit('input', null);
			} else {
				emit('input', val);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.preview {
	display: flex;
	justify-content: center;
	color: var(--primary);
	font-family: var(--family-monospace);
	white-space: nowrap;
	text-overflow: ellipsis;
	cursor: pointer;

	&:empty {
		&::after {
			color: var(--foreground-subdued);
			content: '--';
		}
	}
}

.input {
	padding: 8px 4px;

	&.date,
	&.timestamp,
	&.time,
	&.dateTime {
		min-width: 250px;
	}

	&.geometry,
	&.json {
		width: 500px;
	}
}

input {
	color: var(--primary);
	font-family: var(--family-monospace);
	line-height: 1em;
	border: none;

	&::placeholder {
		color: var(--foreground-subdued);
		font-weight: 500;
		font-family: var(--family-monospace);
	}
}

.dialog {
	position: relative;
	min-width: 800px;
}
</style>
