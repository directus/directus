import { SpecialFolder } from '@/types/folders';
import { Filter } from '@directus/types';
import { subDays } from 'date-fns';

export function getFolderFilter(folder?: string, special?: SpecialFolder, currentUserId?: string): Filter {
	const filterParsed: Filter = {
		_and: [
			{
				type: {
					_nnull: true,
				},
			},
		],
	};

	if (!special) {
		if (folder) {
			filterParsed._and.push({
				folder: {
					_eq: folder,
				},
			});
		} else {
			filterParsed._and.push({
				folder: {
					_null: true,
				},
			});
		}
	}

	if (special === 'mine' && currentUserId) {
		filterParsed._and.push({
			uploaded_by: {
				_eq: currentUserId,
			},
		});
	}

	if (special === 'recent') {
		filterParsed._and.push({
			uploaded_on: {
				_gt: subDays(new Date(), 5).toISOString(),
			},
		});
	}

	return filterParsed;
}
