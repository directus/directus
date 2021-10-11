import isUrlAllowed from './is-url-allowed';

/**
 * Check if email domain matches allow list
 */
export default function isEmailAllowed(email: string, allowList: string | string[]): boolean {
	const emailData = email.split('@');
	return emailData.length > 1 && isUrlAllowed(emailData.pop()!, allowList);
}
