import { v4 as uuid } from 'uuid';
import { company, internet, git as gitFaker, name, image, hacker } from 'faker';
import { Knex } from 'knex';

export const seedTable = async function (
	knex: Knex<any, unknown>,
	count: number,
	table: string,
	factory: () => unknown
): Promise<void> {
	const fakeRow = [];

	for (let i = 0; i < count; i++) {
		fakeRow.push(factory());
	}
	await knex(table).insert(fakeRow);
};

export const createCompany = () => ({
	id: uuid(),
	name: company.companyName(),
	slogan: company.catchPhrase(),
});

export const createEmployee = () => ({
	id: uuid(),
	git_email: internet.email(),
	git_username: internet.userName(),
	name: `name.lastName, + name.firstName`,
	job_title: name.jobTitle(),
});

export const createGitPR = () => ({
	id: uuid(),
	branch: gitFaker.branch(),
	name: hacker.phrase(),
});

export const createGitCommit = () => ({
	id: uuid(),
	branch: gitFaker.branch(),
	commit: gitFaker.commitEntry(),
	message: gitFaker.commitMessage(),
	sha: gitFaker.commitSha(),
	short_sha: gitFaker.shortSha(),
});

export const createProfilePic = () => ({
	id: uuid(),
	source: image.imageUrl(),
});

export const createManyToAny = () => ({
	id: uuid(),
});
