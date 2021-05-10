<template>
	<v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent @esc="cancel">
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title>{{ t('create_bookmark') }}</v-card-title>

			<v-card-text>
				<v-input
					@keyup.enter="$emit('save', bookmarkName)"
					autofocus
					v-model="bookmarkName"
					:placeholder="t('bookmark_name')"
				/>
			</v-card-text>

			<v-card-actions>
				<v-button @click="cancel" secondary>
					{{ t('cancel') }}
				</v-button>
				<v-button
					:disabled="bookmarkName === null || bookmarkName.length === 0"
					@click="$emit('save', bookmarkName)"
					:loading="saving"
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
	emits: ['save', 'update:modelValue'],
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
