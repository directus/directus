import { User } from '@/types';
import { i18n } from '@/lang';

export function userName(user: Partial<User>): string {
	if (user.first_name && user.last_name) {
		return `${user.first_name} ${user.last_name}`;
	}

	if (user.first_name) {
		return user.first_name;
	}

	if (user.email) {
		return user.email;
	}

	return i18n.t('unknown_user') as string;
}
