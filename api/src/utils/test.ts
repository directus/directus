import Joi from 'joi';

const schema = Joi.alternatives().try(
	Joi.object({
		name: Joi.string().required(),
		age: Joi.number()
	}),
	Joi.string(),
).match('all');

const value = {
	age: 25
};

const { error } = schema.validate(value);

console.log(JSON.stringify(error, null, 2));
