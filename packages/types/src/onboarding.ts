export type OnboardingPayload = {
	version: 1;
	body: {
		user?: {
			email?: string;
			wants_emails?: boolean;
			primary_skillset?: string;
		};
		project?: {
			name?: string;
			url?: string;
			type?: string;
		};
	};
};
