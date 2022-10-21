import { getUrl } from '@common/config';
import request from 'supertest';
import vendors from '@common/get-dbs-to-test';

const sampleData = [{ a: 1, b: 2 }, { b: 3 }, { a: [4, 5] }, { a: true, b: false, c: 'test' }];
const exportFormats = ['csv', 'json', 'xml'];
const contentTypes: any = {
	csv: /text\/csv/,
	json: /application\/json/,
	xml: /text\/xml/,
};
const snapshots: any = {
	csv: `"a","b","c"
1,2,
,3,
"[4,5]",,
true,false,"test"`,
	json: `[
	{
		"a": 1,
		"b": 2
	},
	{
		"b": 3
	},
	{
		"a": [
			4,
			5
		]
	},
	{
		"a": true,
		"b": false,
		"c": "test"
	}
]`,
	xml: `<?xml version='1.0'?>
<data>
    <data>
        <a>1</a>
        <b>2</b>
    </data>
    <data>
        <b>3</b>
    </data>
    <data>
        <a>4</a>
        <a>5</a>
    </data>
    <data>
        <a>true</a>
        <b>false</b>
        <c>test</c>
    </data>
</data>`,
};

describe('/utils', () => {
	describe('POST /transform-export', () => {
		for (const format of exportFormats) {
			describe(`exports in ${format.toUpperCase()} format`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.post(`/utils/transform-export?export=${format}`)
						.send(sampleData)
						.expect('Content-Type', contentTypes[format]);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.text).toBe(snapshots[format]);
				});
			});
		}

		describe(`errors on invalid input`, () => {
			for (const format of exportFormats) {
				describe(format.toUpperCase(), () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.post(`/utils/transform-export?export=${format}`)
							.send('not a JSON')
							.expect('Content-Type', /application\/json/);

						// Assert
						expect(response.statusCode).toBe(400);
					});
				});
			}
		});

		describe(`errors on incorrect content type`, () => {
			for (const format of exportFormats) {
				describe(format.toUpperCase(), () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.post(`/utils/transform-export?export=${format}`)
							.send(JSON.stringify(sampleData))
							.expect('Content-Type', /application\/json/);

						// Assert
						expect(response.statusCode).toBe(400);
					});
				});
			}
		});

		describe(`errors on missing export query parameter`, () => {
			it.each(vendors)('%s', async (vendor) => {
				// Action
				const response = await request(getUrl(vendor))
					.post(`/utils/transform-export`)
					.send(sampleData)
					.expect('Content-Type', /application\/json/);

				// Assert
				expect(response.statusCode).toBe(400);
			});
		});

		describe(`errors on invalid export format`, () => {
			it.each(vendors)('%s', async (vendor) => {
				// Action
				const response = await request(getUrl(vendor))
					.post(`/utils/transform-export?export=fake`)
					.send(sampleData)
					.expect('Content-Type', /application\/json/);

				// Assert
				expect(response.statusCode).toBe(400);
			});
		});

		describe(`errors on large input of > 1mb`, () => {
			it.each(vendors)('%s', async (vendor) => {
				// Action
				const response = await request(getUrl(vendor))
					.post(`/utils/transform-export?export=csv`)
					.send({ x: 'o'.repeat(1024 * 1024 - 8) });

				const responseLarge = await request(getUrl(vendor))
					.post(`/utils/transform-export?export=csv`)
					.send({ x: 'o'.repeat(1024 * 1024) });

				// Assert
				expect(response.statusCode).toBe(200);
				expect(responseLarge.statusCode).toBe(400);
			});
		});
	});
});
