<template>
	<v-modal :active="active" title="Test" persistent>
		<template #sidebar>
			<setup-tabs :current.sync="currentTab" :tabs="tabs" :type="type" />
		</template>

		<setup-schema v-if="currentTab[0] === 'schema'" :field-data.sync="fieldData" :type="type" />
		<setup-relationship v-if="currentTab[0] === 'relationship'" :field-data.sync="fieldData" :type="type" />
		<setup-interface v-if="currentTab[0] === 'interface'" :field-data.sync="fieldData" :type="type" />
		<setup-display v-if="currentTab[0] === 'display'" :field-data.sync="fieldData" :type="type" />

		<template #footer>
			<setup-actions :collection="collection" :current.sync="currentTab" :tabs="tabs" />
		</template>
	</v-modal>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed, reactive, PropType } from '@vue/composition-api';
import SetupTabs from './components/tabs.vue';
import SetupActions from './components/actions.vue';
import SetupSchema from './components/schema.vue';
import SetupRelationship from './components/relationship.vue';
import SetupInterface from './components/interface.vue';
import SetupDisplay from './components/display.vue';
import { i18n } from '@/lang';
import { isEmpty } from 'lodash';

export default defineComponent({
	components: {
		SetupTabs,
		SetupActions,
		SetupSchema,
		SetupRelationship,
		SetupInterface,
		SetupDisplay,
	},
	props: {
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		type: {
			type: String as PropType<'standard' | 'file' | 'files' | 'm2o' | 'o2m' | 'm2m'>,
			default: null,
		},
	},
	setup(props) {
		const active = ref(false);

		const fieldData = reactive({
			collection: props.collection,
			field: null,
			database: {
				type: null,
				default_value: null,
				max_length: null,
				is_nullable: true,
				comment: '',
			},
			system: {
				hidden: false,
				interface: null,
				options: null,
				display: null,
				display_options: null,
				readonly: false,
				special: null,
			},
		});

		// This makes sure we still see the enter animation
		onMounted(() => {
			active.value = true;
		});

		const tabs = computed(() => {
			return [
				{
					text: i18n.t('schema'),
					value: 'schema',
					disabled: false,
				},
				// {
				// 	text: i18n.t('relationship'),
				// 	value: 'relationship',
				// },
				{
					text: i18n.t('interface'),
					value: 'interface',
					disabled: interfaceDisabled(),
				},
				{
					text: i18n.t('display'),
					value: 'display',
					disabled: displayDisabled(),
				},
			];
		});

		const currentTab = ref(['schema']);

		return { active, tabs, currentTab, fieldData };

		function interfaceDisabled() {
			return isEmpty(fieldData.field) || isEmpty(fieldData.database.type);
		}

		function displayDisabled() {
			return isEmpty(fieldData.field) || isEmpty(fieldData.database.type);
		}
	},
});
</script>
