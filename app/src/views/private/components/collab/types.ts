import type { CollabUser } from '@/composables/use-collab';
export type { CollabUser };

export type CollabUserFormatted = Pick<CollabUser, 'id' | 'color' | 'connection'> & {
	name: string | undefined;
	avatar_url: string | undefined;
};

export type CollabUserHeader = CollabUserFormatted & {
	focusedField: string | null;
	isCurrentUser: boolean;
};
