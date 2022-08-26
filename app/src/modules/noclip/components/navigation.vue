<template>
	<v-list nav v-model="active">
		<v-list-item  to="/noclip" exact>
			<v-list-item-icon><v-icon name="dashboard" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="t('dashboard')" />
			</v-list-item-content>
		</v-list-item>
        <v-list-group :active="interfacesActive" :open="interfacesActive">
            <template #activator>
                <v-list-item-icon><v-icon name="keyboard" /></v-list-item-icon>
                <v-list-item-content>
                    <v-text-overflow :text="t('interfaces')" />
                </v-list-item-content>
            </template>

            <v-list-item v-for="item in interfaceItems" :to="item.to" :key="item.name">
                <v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
                <v-list-item-content>
                    <v-text-overflow :text="item.name" />
                </v-list-item-content>
            </v-list-item>
        </v-list-group>
        <v-list-group :active="displaysActive" :open="displaysActive">
            <template #activator>
                <v-list-item-icon><v-icon name="monitor" /></v-list-item-icon>
                <v-list-item-content>
                    <v-text-overflow :text="t('displays')" />
                </v-list-item-content>
            </template>

            <v-list-item v-for="item in displayItems"  :to="item.to" :key="item.name">
                <v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
                <v-list-item-content>
                    <v-text-overflow :text="item.name" />
                </v-list-item-content>
            </v-list-item>
        </v-list-group>
	</v-list>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { getInterfaces } from '@/interfaces';
import { getDisplays } from '@/displays';
import { useRouter } from 'vue-router';
import { computed } from 'vue';

const {currentRoute} = useRouter();

const { t } = useI18n();

const {interfaces} = getInterfaces()
const {displays} = getDisplays()

const interfaceItems = interfaces.value.filter(component => component.system !== true).map(component => ({
    icon: component.icon,
    name: component.name,
    to: `/noclip/interfaces/${component.id}`,
}))

const displayItems = displays.value.map(component => ({
    icon: component.icon,
    name: component.name,
    to: `/noclip/displays/${component.id}`,
}))

const interfacesActive = computed(() => {
    return currentRoute.value.path.startsWith('/noclip/interfaces');
})

const displaysActive = computed(() => {
    return currentRoute.value.path.startsWith('/noclip/displays');
})
</script>
