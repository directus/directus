import { useCollectionPermissions } from '@/composables/use-permissions';
import {
    useRelationPermissionsM2O,
    useRelationPermissionsO2M,
    useRelationPermissionsM2M,
    useRelationPermissionsM2A,
    useRelationPermissionsTree,
    useRelationPermissionsTranslations,
} from '@/composables/use-relation-permissions';
import { UsableCollectionPermissions } from '@/composables/use-permissions/collection/use-collection-permissions';

export async function getRelationalPermissions(field: any): Promise<UsableCollectionPermissions | null> {
    if (!field?.meta?.interface) return null;

    if (field.meta.interface === 'm2o') {
        return useRelationPermissionsM2O(field);
    } else if (field.meta.interface === 'o2m') {
        return useRelationPermissionsO2M(field);
    } else if (field.meta.interface === 'm2m') {
        return useRelationPermissionsM2M(field);
    } else if (field.meta.interface === 'm2a') {
        return useRelationPermissionsM2A(field);
    } else if (field.meta.interface === 'tree') {
        return useRelationPermissionsTree(field);
    } else if (field.meta.interface === 'translations') {
        return useRelationPermissionsTranslations(field);
    } else if (field.meta.interface === 'files') {
        return await useCollectionPermissions('directus_files');
    }

    return null;
}
