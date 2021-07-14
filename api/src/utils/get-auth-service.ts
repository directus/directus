import { Accountability } from '../types/accountability';
import { BasicAuthenticationService, LDAPAuthenticationService } from '../services';

export default (accountability: Accountability | null) => {
	if (accountability?.ldap) {
		return LDAPAuthenticationService;
	}
	return BasicAuthenticationService;
};
