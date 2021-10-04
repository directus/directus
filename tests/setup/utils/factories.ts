import { v4 as uuid } from 'uuid';
import { company, internet, git as gitFaker, name, image, hacker } from 'faker';
import { Knex } from 'knex';

// type ProfilePic = {
// 	id: string;
// 	source: string;
// 	employee?: string;
// };
// type GitPR = {
// 	id: string;
// 	branch: string;
// 	name: string;
// };
// type Company = {
// 	id: string;
// 	name: string;
// 	slogan: string;
// };

// type Employee = {
// 	id: string;
// 	git_email: string;
// 	git_username: string;
// 	name: string;
// 	job_title: string;
// 	profile_pic?: string;
// 	company?: string;
// 	git_commit?: string;
// 	git_pr?: string;
// };
// type Item = Employee | Company | GitPR | ProfilePic | unknown;

export const seedTable = async function (
	knex: Knex<any, unknown>,
	count: number,
	table: string,
	factory: any
): Promise<void> {
	if (typeof factory === 'object') {
		await knex(table).insert(factory);
	} else {
		const fakeRow = [];
		for (let i = 0; i < count; i++) {
			fakeRow.push(factory());
		}
		await knex(table).insert(fakeRow);
	}
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
export const createEmployeePRJoinTable = (employeeId: string, gitPrId: string) => ({
	id: uuid(),
	employee_id: employeeId,
	git_pr_id: gitPrId,
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
