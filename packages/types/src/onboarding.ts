export type OnboardingPayload = {
	version: 1;
	body: {
		user?: {
			email: string | null;
			wants_emails: boolean | null;
			primary_skillset: string | null;
		};
		project?: {
			name: string | null;
			url: string | null;
			type: string | null;
		};
	};
};
