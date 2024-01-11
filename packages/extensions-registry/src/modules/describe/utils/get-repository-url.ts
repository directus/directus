export const getRepositoryUrl = (repository: { type: string; url: string }) => {
	if (repository.type === 'git') {
		/*
		 * Git Repo URLs are in the following format:
		 * "git+https://github.com/directus/directus.git"
		 */
		return repository.url.slice(4);
	}

	return null;
};
