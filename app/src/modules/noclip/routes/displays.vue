<template>
	<private-view :title="title">
		<template v-if="breadcrumb" #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="people_alt" />
			</v-button>
		</template>

		<template #actions:prepend>
			
		</template>

		<template #actions>
			
		</template>

		<template #navigation>
			<navigation />
		</template>

        <div class="main">
            <div class="component">
                <component v-if="loaded" :is="`display-${id}`" v-bind="bindings" />
            </div>

            <v-divider />

            <div class="props">
                <v-form v-model="bindings" :fields="fields" />
            </div>
        </div>
	</private-view>
</template>

<script lang="ts" setup>
import Navigation from '../components/navigation.vue';
import { ComponentInternalInstance, computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Field } from '@directus/shared/types';
import formatTitle from '@directus/format-title';
import { getDisplay } from '@/displays';

interface Props {
	role: string | null;
    id: string
}

interface PropInfo {
    type: any,
    default?: string | boolean | number | (() => any),
    required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	role: null,
});

const { t } = useI18n();

const { breadcrumb, title } = useBreadcrumb();

const displayInfo = computed(() => getDisplay(props.id))

const bindings = ref<Record<string, any>>({})
const loaded = ref(false)

watch(displayInfo, (newValue) => {
    if (newValue) {
        bindings.value = {}
        const props = (newValue.component as any as ComponentInternalInstance).props as Record<string, PropInfo>

        for(const [key, value] of Object.entries(props)) {
            bindings.value[key] = getDefaultValue(value)
        }

        loaded.value = true
    } else {
        loaded.value = false
    }
}, { immediate: true })

const fields = computed(() => {
    if (!displayInfo.value) return []
    const props = (displayInfo.value.component as any).props as Record<string, PropInfo>

    const fields = Object.entries(props).map(([key, value]) => {
        return {
            collection: 'directus_users',
            field: key,
            meta: {
                interface: getDefaultInterface(value.type),
                width: 'half'
            },
            schema: {
                default_value: getDefaultValue(value),
            },
            name: formatTitle(key),
            type: typeToString(value.type),
        } as Field
    })
    return fields
})

function typeToString(type: any) {
    switch(type) {
        case String:
            return 'string'
        case Number:
            return 'integer'
        case Boolean:
            return 'boolean'
        case Array:
            return 'csv'
        case Object:
            return 'json'
        default:
            return 'string'
    }
}

function getDefaultInterface(type: any) {
    switch(type) {
        case String:
            return 'text'
        case Number:
            return 'number'
        case Boolean:
            return 'checkbox'
        default:
            return 'text'
    }
}

function getDefaultValue(prop: PropInfo) {
    if (prop.default) {
        return typeof prop.default === 'function' ? prop.default() : prop.default
    } else if (prop.required) {
        switch(prop.type) {
            case String:
                return ''
            case Number:
                return 0
            case Boolean:
                return false
            case Array:
                return []
            case Object:
                return {}
            default:
                return null
        }
    } else {
        return undefined
    }
}


function useBreadcrumb() {
	const breadcrumb = computed(() => {
		if (!props.role) return null;

		return [
			{
				name: t('user_directory'),
				to: `/noclip`,
			},
		];
	});

	const title = computed(() => {
		return `Displays / ${displayInfo.value?.name}`;
	});

	return { breadcrumb, title };
}

</script>

<style lang="scss" scoped>
.main {
    padding: var(--content-padding);
    .component {
        margin-bottom: 40px;
    }

    .props {
        margin-top: 40px;
    }
}

.event {
    width: 100%;
    margin: 5px 0;
    cursor: pointer;

    &:hover::before {
        z-index: -1;
        position: absolute;
        content: '';
        top: -5px;
        bottom: -5px;
        left: -5px;
        right: -5px;
        background-color: var(--background-normal-alt);
        border-radius: var(--border-radius);
    }

    .title {
        display: flex;
        justify-content: space-between;

        .date {
            color: var(--foreground-subdued);
        }
    }

    .value {
        color: var(--primary)
    }
}
</style>
