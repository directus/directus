export type ServerInfo = {
	project: null | {
		project_name: string | null;
		project_descriptor: string | null;
		project_logo: string | null;
		project_color: string | null;
		default_language: string | null;
		public_foreground: string | null;
		public_background: string | null;
		public_note: string | null;
		custom_css: string | null;
	};
	rateLimit?:
		| false
		| {
				points: number;
				duration: number;
		  };
	rateLimitGlobal?:
		| false
		| {
				points: number;
				duration: number;
		  };
	queryLimit?: {
		default: number;
		max: number;
	};
	websocket?:
		| false
		| {
				rest:
					| false
					| {
							authentication: string;
							path: string;
					  };
				graphql:
					| false
					| {
							authentication: string;
							path: string;
					  };
				heartbeat: false | number;
		  };
	showAdminOnboarding?: boolean;
};
