<template>
	<v-detail v-model="detailOpen" :start-open="start === 'open'" class="group-detail">
		<template #activator="{ toggle, active }">
			<v-divider
				:style="{
					'--v-divider-label-color': headerColor,
				}"
				:class="{ active, edited }"
				:inline-title="false"
				large
				@click="toggle"
			>
				<template v-if="headerIcon" #icon><v-icon :name="headerIcon" class="header-icon" /></template>
				<template v-if="field.name">
					<span v-if="edited" v-tooltip="t('edited')" class="edit-dot"></span>
					<span class="title">{{ field.name }}</span>
				</template>
				<v-icon
					v-if="!active && validationMessages!.length > 0"
					v-tooltip="validationMessages!.join('\n')"
					class="warning"
					name="error_outline"
					small
				/>
				<v-icon class="expand-icon" name="expand_more" />
			</v-divider>
		</template>

		<v-form
			:initial-values="initialValues"
			:fields="fields"
			:model-value="values"
			:primary-key="primaryKey"
			:group="field.meta.field"
			:validation-errors="validationErrors"
			:loading="loading"
			:batch-mode="batchMode"
			:disabled="disabled"
			:badge="badge"
			:direction="direction"
			nested
			@update:model-value="$emit('apply', $event)"
		/>
	</v-detail>
</template>

<script lang="ts">
import { Field } from '@directus/shared/types';
import { computed, defineComponent, PropType, ref, watch } from 'vue';
import { ValidationError } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';
import formatTitle from '@directus/format-title';
import { isEqual } from 'lodash';

export default defineComponent({
	name: 'InterfaceGroupDetail',
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		fields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
		values: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		initialValues: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		batchMode: {
			type: Boolean,
			default: false,
		},
		batchActiveFields: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		primaryKey: {
			type: [Number, String],
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		validationErrors: {
			type: Array as PropType<ValidationError[]>,
			default: () => [],
		},
		badge: {
			type: String,
			default: null,
		},

		start: {
			type: String,
			enum: ['open', 'closed'],
			default: 'open',
		},
		headerIcon: {
			type: String,
			default: null,
		},
		headerColor: {
			type: String,
			default: null,
		},
		direction: {
			type: String,
			default: undefined,
		},
	},
	emits: ['apply'],
	setup(props) {
		const { t } = useI18n();

		const detailOpen = ref(props.start === 'open');

		const edited = computed(() => {
			if (!props.values) return false;

			const editedFields = Object.keys(props.values);
			return props.fields.some((field) => editedFields.includes(field.field));
		});

		const validationMessages = computed(() => {
			if (!props.validationErrors) return;

			const fields = props.fields.map((field) => field.field);

			const errors = props.validationErrors.reduce((acc, validationError) => {
				if (fields.includes(validationError.field) === false) return acc;

				if (validationError.code === 'RECORD_NOT_UNIQUE') {
					acc.push(`${formatTitle(validationError.field)} ${t('validationError.unique').toLowerCase()}`);
				} else {
					acc.push(
						`${formatTitle(validationError.field)} ${t(
							`validationError.${validationError.type}`,
							validationError
						).toLowerCase()}`
					);
				}
				return acc;
			}, [] as string[]);

			if (errors.length === 0) return [];

			return errors;
		});

		watch(validationMessages, (newVal, oldVal) => {
			if (!validationMessages.value) return;
			if (isEqual(newVal, oldVal)) return;
			detailOpen.value = validationMessages.value.length > 0;
		});

		return { t, edited, validationMessages, detailOpen };
	},
});
</script>

<style scoped>
.v-form {
	padding-top: calc(var(--form-vertical-gap) / 2);
}

.v-divider {
	cursor: pointer;
}

.v-divider .expand-icon {
	float: right;
	transform: rotate(90deg) !important;
	transition: transform var(--fast) var(--transition);
}

.v-divider.active .expand-icon {
	transform: rotate(0) !important;
}

.v-divider :deep(.type-text) {
	position: relative;
}

.v-divider.edited:not(.active) .edit-dot {
	position: absolute;
	top: 7px;
	left: -7px;
	display: block;
	width: 4px;
	height: 4px;
	background-color: var(--foreground-subdued);
	border-radius: 4px;
	content: '';
}

.header-icon {
	margin-right: 12px !important;
}

.warning {
	margin-left: 8px;
	color: var(--danger);
}
</style>
