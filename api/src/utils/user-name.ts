import type { User } from '@directus/types';

export function userName(user: Partial<User>): string {
	if (!user) {
		return 'Unknown User';
	}

	if (user.first_name && user.last_name) {
		return `${user.first_name} ${user.last_name}`;
	}

	if (user.first_name) {
		return user.first_name;
	}

	if (user.email) {
		return user.email;
	}

	return 'Unknown User';
}
