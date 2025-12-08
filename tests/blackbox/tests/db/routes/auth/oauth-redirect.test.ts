import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

describe('/auth/login/github redirect validation', () => {
<<<<<<< Updated upstream
  describe('blocks unlisted redirect URLs', () => {
    it.each(vendors)('%s', async (vendor) => {
      const response = await request(getUrl(vendor)).get('/auth/login/github?redirect=https://malicious.com/steal');

      expect(response.statusCode).toBe(400);
      expect(response.body.errors[0].extensions.code).toBe('INVALID_PAYLOAD');
    });
  });

  describe('blocks protocol-relative redirect URLs', () => {
    it.each(vendors)('%s', async (vendor) => {
      const response = await request(getUrl(vendor)).get('/auth/login/github?redirect=//malicious.com/steal');

      expect(response.statusCode).toBe(400);
      expect(response.body.errors[0].extensions.code).toBe('INVALID_PAYLOAD');
    });
  });

  describe('allows relative path redirects', () => {
    it.each(vendors)('%s', async (vendor) => {
      const response = await request(getUrl(vendor)).get('/auth/login/github?redirect=/admin/content');

      expect(response.statusCode).toBe(302);
      expect(response.headers['location']).toContain('github.com');
    });
  });

  describe('allows redirect to PUBLIC_URL origin', () => {
    it.each(vendors)('%s', async (vendor) => {
      const publicUrl = getUrl(vendor);

      const response = await request(getUrl(vendor)).get(`/auth/login/github?redirect=${publicUrl}/admin/content`);

      expect(response.statusCode).toBe(302);
      expect(response.headers['location']).toContain('github.com');
    });
  });

  describe('callback URL matches PUBLIC_URL', () => {
    it.each(vendors)('%s', async (vendor) => {
      const response = await request(getUrl(vendor)).get('/auth/login/github?redirect=/admin');

      expect(response.statusCode).toBe(302);

      const location = response.headers['location'] as string;
      const redirectUri = decodeURIComponent(location.split('redirect_uri=')[1]!.split('&')[0]!);

      expect(redirectUri).toBe(`${getUrl(vendor)}/auth/login/github/callback`);
    });
  });

  describe('no redirect parameter defaults to empty (allowed)', () => {
    it.each(vendors)('%s', async (vendor) => {
      const response = await request(getUrl(vendor)).get('/auth/login/github');

      expect(response.statusCode).toBe(302);
      expect(response.headers['location']).toContain('github.com');
    });
  });
=======
	describe('blocks unlisted redirect URLs', () => {
		it.each(vendors)('%s', async (vendor) => {
			const response = await request(getUrl(vendor)).get('/auth/login/github?redirect=https://malicious.com/steal');

			expect(response.statusCode).toBe(400);
			expect(response.body.errors[0].extensions.code).toBe('INVALID_PAYLOAD');
		});
	});

	describe('blocks protocol-relative redirect URLs', () => {
		it.each(vendors)('%s', async (vendor) => {
			const response = await request(getUrl(vendor)).get('/auth/login/github?redirect=//malicious.com/steal');

			expect(response.statusCode).toBe(400);
			expect(response.body.errors[0].extensions.code).toBe('INVALID_PAYLOAD');
		});
	});

	describe('allows relative path redirects', () => {
		it.each(vendors)('%s', async (vendor) => {
			const response = await request(getUrl(vendor)).get('/auth/login/github?redirect=/admin/content');

			expect(response.statusCode).toBe(302);
			expect(response.headers['location']).toContain('github.com');
		});
	});

	describe('allows redirect to PUBLIC_URL origin', () => {
		it.each(vendors)('%s', async (vendor) => {
			const publicUrl = getUrl(vendor);

			const response = await request(getUrl(vendor)).get(`/auth/login/github?redirect=${publicUrl}/admin/content`);

			expect(response.statusCode).toBe(302);
			expect(response.headers['location']).toContain('github.com');
		});
	});

	describe('callback URL matches PUBLIC_URL', () => {
		it.each(vendors)('%s', async (vendor) => {
			const response = await request(getUrl(vendor)).get('/auth/login/github?redirect=/admin');

			expect(response.statusCode).toBe(302);

			const location = response.headers['location'] as string;
			const redirectUri = decodeURIComponent(location.split('redirect_uri=')[1]!.split('&')[0]!);

			expect(redirectUri).toBe(`${getUrl(vendor)}/auth/login/github/callback`);
		});
	});

	describe('no redirect parameter defaults to empty (allowed)', () => {
		it.each(vendors)('%s', async (vendor) => {
			const response = await request(getUrl(vendor)).get('/auth/login/github');

			expect(response.statusCode).toBe(302);
			expect(response.headers['location']).toContain('github.com');
		});
	});
>>>>>>> Stashed changes
});
