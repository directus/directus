<template>
    <v-drawer
        :model-value="isOpen"
		:title="'Create new Task'"
		:subtitle="t('panel_options')"
		:icon="'insert_chart'"
		persistent
		@cancel="close"
    >
        <template #actions>
			<v-button v-tooltip.bottom="t('done')" icon rounded @click="emitSave">
				<v-icon name="check" />
			</v-button>
		</template>

        <div class="content">
            <div class="grid">
                <div class="field half">
                    <div class="type-label">{{ t('name') }}</div>
                    <v-input></v-input>
                </div>
                <div class="field half">
                    <div class="type-label">{{ t('name') }}</div>
                    <v-input></v-input>
                </div>
            </div>
            <hr />
            <extension-options type="operation"></extension-options>
        </div>
    </v-drawer>
</template>

<script setup lang="ts">
import { useDialogRoute } from '@/composables/use-dialog-route';
import { router } from '@/router';
import { useI18n } from 'vue-i18n';
import ExtensionOptions from '@/modules/settings/data-model/field-detail/shared/extension-options.vue';

const props = withDefaults(defineProps<{
    primaryKey: string
    operationKey: string
}>(), {

})

const emit = defineEmits(['save'])

const isOpen = useDialogRoute();
const { t } = useI18n();

function close() {
    router.push({ path: `/settings/flows/${props.primaryKey}` });
}

function emitSave() {
    emit('save');
}
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.content {
    padding: var(--content-padding);
    padding-top: 0;
    padding-bottom: var(--content-padding-bottom);
    
    .grid {
        @include form-grid;
    }
}

.type-label {
	margin-bottom: 8px;
}

</style>