<template>
	<v-modal v-model="_active" :title="$t('editing_in', { collection })" persistent>
		<v-form
			:loading="loading"
			:initial-values="item"
			:collection="collection"
			:primary-key="primaryKey"
			v-model="_edits"
		/>

		<template #footer>
			<v-button @click="cancel" secondary>{{ $t('cancel') }}</v-button>
			<v-button @click="save">{{ $t('save') }}</v-button>
		</template>
	</v-modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, watch } from '@vue/composition-api';
import api from '@/api';
import useProjectsStore from '@/stores/projects';

export default defineComponent({
	model: {
		prop: 'edits',
	},
	props: {
		active: {
			type: Boolean,
			default: false,
		},
		collection: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: [String, Number],
			required: true,
		},
		edits: {
			type: Object as PropType<Record<string, any>>,
			default: undefined,
		},
	},
	setup(props, { emit }) {
		const projectsStore = useProjectsStore();

		const { _active } = useActiveState();
		const { _edits, loading, error, item } = useItem();
		const { save, cancel } = useActions();

		return { _active, _edits, loading, error, item, save, cancel };

		function useActiveState() {
			const localActive = ref(false);

			const _active = computed({
				get() {
					return props.active === undefined ? localActive.value : props.active;
				},
				set(newActive: boolean) {
					localActive.value = newActive;
					emit('update:active', newActive);
				},
			});

			return { _active };
		}

		function useItem() {
			const localEdits = ref<Record<string, any>>({});

			const _edits = computed<Record<string, any>>({
				get() {
					if (props.edits !== undefined) {
						return {
							...props.edits,
							...localEdits.value,
						};
					}

					return localEdits.value;
				},
				set(newEdits) {
					localEdits.value = newEdits;
				},
			});

			const loading = ref(false);
			const error = ref(null);
			const item = ref<Record<string, any>>(null);

			watch(
				() => props.active,
				(isActive) => {
					if (isActive === true) {
						if (props.primaryKey !== '+') fetchItem();
					} else {
						loading.value = false;
						error.value = null;
						item.value = null;
						localEdits.value = {};
					}
				}
			);

			return { _edits, loading, error, item, fetchItem };

			async function fetchItem() {
				const { currentProjectKey } = projectsStore.state;

				loading.value = true;

				try {
					const response = await api.get(
						`/${currentProjectKey}/items/${props.collection}/${props.primaryKey}`
					);

					item.value = response.data.data;
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}
		}

		function useActions() {
			return { save, cancel };

			function save() {
				emit('input', _edits.value);
				_active.value = false;
				_edits.value = {};
			}

			function cancel() {
				_active.value = false;
				_edits.value = {};
			}
		}
	},
});
</script>
