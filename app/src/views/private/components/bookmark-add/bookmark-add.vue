<template>
	<v-dialog :active="active" @toggle="$listeners.toggle" persistent @esc="cancel">
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title>{{ $t('create_bookmark') }}</v-card-title>

			<v-card-text>
				<v-input
					@keyup.enter="$emit('save', bookmarkName)"
					autofocus
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
import { defineComponent, ref } from '@vue/composition-api';

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
	},
	setup(props, { emit }) {
		const bookmarkName = ref(null);

		return { bookmarkName, cancel };

		function cancel() {
			bookmarkName.value = null;
			emit('toggle', false);
		}
	},
});
</script>
