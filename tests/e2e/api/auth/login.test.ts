import { getDBsToTest } from '../../get-dbs-to-test';

// The first describe is the endpoint
describe('auth', () => {
	// second describe is the action
	describe('login', () => {
		// Then describe the scenario
		describe('when correct credentials are provided', () => {
			// use "it" to describe the result
			// use it.each(getDBsToTest()) to test on every enabled database. getDBsToTest() must be imported
            // "vendor" is the DB returned from getDBsToTest(). It is used to replace %p in the test description
            // Start the test description with %p so that which db failed is obvious. 
			it.each(getDBsToTest())(`%p returns an access_token and a refresh_token`, async (vendor) => {
                
            });
		});
        describe('when incorrect credentials are provided', () => {
			it.each(getDBsToTest())(`%p returns `, async (vendor) => {
                
            });
	});
});