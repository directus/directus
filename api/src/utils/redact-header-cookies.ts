export function redactHeaderCookie(cookieHeader: string, cookieNames: string[]) {
	for (const cookieName of cookieNames) {
		const re = new RegExp(`(${cookieName}=)([^;]+)`);
		cookieHeader = cookieHeader.replace(re, `$1--redacted--`);
	}
	return cookieHeader;
}
