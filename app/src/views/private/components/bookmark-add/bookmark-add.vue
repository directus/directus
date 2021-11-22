<template>
	<v-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)" @esc="cancel">
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title>{{ t('create_bookmark') }}</v-card-title>

			<v-card-text>
				<v-input
					v-model="bookmarkName"
					autofocus
					:placeholder="t('bookmark_name')"
					@keyup.enter="$emit('save', bookmarkName)"
				/>
			</v-card-text>

			<v-card-actions>
				<v-button secondary @click="cancel">
					{{ t('cancel') }}
				</v-button>
				<v-button
					:disabled="bookmarkName === null || bookmarkName.length === 0"
					:loading="saving"
					@click="$emit('save', bookmarkName)"
				>
					{{ t('save') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref } from 'vue';

export default defineComponent({
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
		saving: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['save', 'update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const bookmarkName = ref(null);

		return { t, bookmarkName, cancel };

		function cancel() {
			bookmarkName.value = null;
			emit('update:modelValue', false);
		}
	},
});
</script>
