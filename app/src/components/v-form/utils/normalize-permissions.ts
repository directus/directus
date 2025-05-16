import { computed } from 'vue';
import { UsableCollectionPermissions } from '@/composables/use-permissions/collection/use-collection-permissions';

export function normalizePermissions(
    permissions: Partial<UsableCollectionPermissions>
): UsableCollectionPermissions {
    return {
        createAllowed: permissions.createAllowed || computed(() => false),
        updateAllowed: permissions.updateAllowed || computed(() => false),
        readAllowed: permissions.readAllowed || computed(() => false),
        deleteAllowed: permissions.deleteAllowed || computed(() => false),
        sortAllowed: permissions.sortAllowed || computed(() => false),
        archiveAllowed: permissions.archiveAllowed || computed(() => false),
        revisionsAllowed: permissions.revisionsAllowed || computed(() => false),
    };
}
