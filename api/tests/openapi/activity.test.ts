import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Activity', function () {
	it('GET /activity', async function () {
		const res = await axios.get(`${api}/activity?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /activity/{id}', async function () {
		const res = await axios.get(`${api}/activity/1?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	var comment_id: number;

	//   it('POST /activity/comment', async function() {

	//     const res = await axios.post(`${api}/activity/comment/?access_token=admin`, {
	//       collection: "customers",
	//       item: 1,
	//       comment: "test comment"
	//     });

	//     comment_id = res.data.data[0].id
	//     console.log(comment_id);

	//     expect(res.status).toEqual(200);
	//     expect(res).toSatisfyApiSpec();
	//   });

	//   it('PATCH /activity/comment/{id}', async function() {

	//     const res = await axios.patch(`${api}/activity/comment/${comment_id}?access_token=admin`, {
	//       comment: "comment change"
	//     });

	//     expect(res.status).toEqual(200);
	//     expect(res).toSatisfyApiSpec();
	//   });

	//   it('DELETE /activity/comment/{id}', async function() {

	//     const res = await axios.delete(`${api}/activity/comment/${comment_id}?access_token=admin`);

	//     expect(res.status).toEqual(200);
	//     expect(res).toSatisfyApiSpec();
	//   });
});
