import { ActionPermission } from '@/types/permissions';

export const isFullPermission = (permission: ActionPermission) => permission.full_access;
