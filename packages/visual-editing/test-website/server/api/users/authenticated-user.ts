import { directusServer, readMe } from '../../utils/directus-server';
import { defineEventHandler } from 'h3';

export default defineEventHandler(async () => {
	try {
		const user = await directusServer.request(readMe({ fields: ['id', 'role'] }));
		return { isAuthenticated: !!user.id, user };
	} catch {
		return { isAuthenticated: false, user: null };
	}
});
