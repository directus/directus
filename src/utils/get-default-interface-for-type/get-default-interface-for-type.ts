export default function getDefaultInterfaceForType(type: string | null | undefined) {
	switch (type) {
		case 'datetime':
		case 'date':
		case 'time':
		case 'datetime_created':
		case 'datetime_updated':
			return 'datetime';

		case 'owner':
		case 'user_updated':
		case 'user':
			return 'user';

		case 'file':
			return 'file';

		case 'integer':
		case 'sort':
		case 'decimal':
			return 'numeric';

		case 'status':
			return 'status';

		case 'slug':
			return 'slug';

		case 'm2o':
			return 'many-to-one';

		case 'json':
			return 'code';

		case 'array':
			return 'tags';

		case 'hash':
		case 'group':
		case 'lang':
		case 'translation':
		case 'uuid':
		case 'string':
		case 'alias':
		case 'binary':
		case 'boolean':
		case 'o2m':
		default:
			return 'text-input';
	}
}
