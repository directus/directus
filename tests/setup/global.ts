import Dockerode from 'dockerode';
import { Knex } from 'knex';

type Global = {
	databaseContainers: { vendor: string; container: Dockerode.Container }[];
	directusContainers: { vendor: string; container: Dockerode.Container }[];
	knexInstances: { vendor: string; knex: Knex }[];
};

const global: Global = {
	databaseContainers: [],
	directusContainers: [],
	knexInstances: [],
};

export default global;
