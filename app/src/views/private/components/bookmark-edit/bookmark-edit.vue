<template>
	<v-dialog :active="active" @toggle="$listeners.toggle" persistent @esc="cancel">
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title>{{ $t('edit_bookmark') }}</v-card-title>

			<v-card-text>
				<v-input
					autofocus
					@keyup.enter="$emit('save', bookmarkName)"
					v-model="bookmarkName"
					:placeholder="$t('bookmark_name')"
				/>
			</v-card-text>

			<v-card-actions>
				<v-button @click="cancel" secondary>
					{{ $t('cancel') }}
				</v-button>
				<v-button
					:disabled="bookmarkName === null || bookmarkName.length === 0"
					@click="$emit('save', bookmarkName)"
					:loading="saving"
				>
					{{ $t('save') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';

export default defineComponent({
	model: {
		prop: 'active',
		event: 'toggle',
	},
	props: {
		active: {
			type: Boolean,
			default: false,
		},
		saving: {
			type: Boolean,
			default: false,
		},
		name: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const bookmarkName = ref(props.name);

		watch(
			() => props.name,
			(newName: string) => (bookmarkName.value = newName)
		);

		return { bookmarkName, cancel };

		function cancel() {
			emit('toggle', false);
		}
	},
});
</script>
