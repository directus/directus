import { PassThrough } from 'stream';
import { InvalidPayloadError } from '@directus/errors';
import type { Request, Response } from 'express';
import FormData from 'form-data';
import { describe, expect, it, vi } from 'vitest';
import { multipartHandler } from './files.js';

vi.mock('../../src/database');

vi.mock('../services', () => {
	const FilesService = vi.fn();
	FilesService.prototype.uploadOne = vi.fn();
	const MetaService = vi.fn();
	MetaService.prototype.getMetaForQuery = vi.fn().mockResolvedValue({});
	return { FilesService };
});

describe('multipartHandler', () => {
	it(`Errors out if request doesn't contain any files to upload`, () => {
		const fakeForm = new FormData();

		fakeForm.append('field', 'test');

		const req = {
			headers: fakeForm.getHeaders(),
			is: vi.fn().mockReturnValue(true),
			body: fakeForm.getBuffer(),
			params: {},
			pipe: (input: NodeJS.WritableStream) => stream.pipe(input),
		} as unknown as Request;

		const res = {} as Response;

		const stream = new PassThrough();
		stream.push(fakeForm.getBuffer());

		multipartHandler(req, res, (err) => {
			expect(err.message).toBe('No files where included in the body');
			expect(err).toBeInstanceOf(InvalidPayloadError);
		});
	});

	it(`Errors out if uploaded file doesn't include the filename`, () => {
		const fakeForm = new FormData();

		fakeForm.append(
			'file',
			Buffer.from(
				'<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="100%" height="100%" viewBox="0 0 243 266" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;"><g id="Calligraphy"><path d="M67.097,135.868c0,3.151 0.598,14.121 -11.586,14.121c-17.076,0 -15.95,-12.947 -15.95,-12.947c0,-2.521 4.597,-5.638 4.597,-7.318c0,-0.63 0.041,-3.519 -2.27,-3.519c-5.671,0 -5.671,10.083 -5.671,10.083c0,0 0.419,15.336 19.116,15.336c20.205,0 30.04,-23.712 30.04,-30.88c0,-18.197 -51.112,-27.701 -51.112,-57.949c0,1.575 -2.205,-13.864 14.18,-13.864c28.358,0 44.426,42.536 44.426,71.524c0,28.988 -16.699,55.455 -16.699,55.455c0,0 33.4,-25.837 33.4,-76.25c0,-70.264 -46.003,-69.634 -46.003,-69.634c-4.792,0 -7.602,-0.241 -28.398,20.555c-20.797,20.797 -17.646,29.83 -17.646,29.83c0,31.93 49.576,32.35 49.576,55.457Z" style="fill-rule:nonzero;"/><path d="M241.886,174.861c-1.602,-9.142 -15.448,-9.916 -22.675,-9.682c-0.7,-0.003 -1.172,0.02 -1.327,0.03c-8.804,0.01 -19.314,4.179 -33.072,13.115c-3.554,2.308 -7.19,4.847 -10.902,7.562c-6.979,-31.39 -13.852,-63.521 -28.033,-63.521c20.415,-20.119 22.19,-16.272 22.19,-39.054c0,-11.244 14.498,-21.35 14.498,-21.35l-0.296,-2.024c-19.193,5.304 -37.307,-8.577 -42.2,-12.755c5.375,-9.663 9.584,-12.565 9.584,-12.565c1.891,-20.377 15.965,-27.31 15.965,-27.31c1.681,-4.201 6.092,-7.142 6.092,-7.142c-70.162,22.267 -54.247,189.298 -54.247,189.298c-0.475,-55.91 5.238,-92.242 11.977,-115.55c9.094,8.248 24.425,11.765 24.425,11.765c-7.396,3.55 -5.324,12.13 -5.324,19.527c0,7.397 -3.848,10.651 -3.848,10.651l-21.893,22.782c17.043,0.294 23.638,31.657 30.689,63.056c-2.548,2.042 -5.125,4.12 -7.728,6.219c-16.396,13.223 -33.351,26.897 -50.266,37.354c-19.086,11.797 -35.151,17.533 -49.116,17.533c-25.25,0 -44.118,-24.368 -44.118,-46.154c0,-9.838 3.227,-17.831 5.935,-22.805c2.935,-5.39 5.911,-8.503 5.967,-8.561c0.001,0 0.001,0 0.001,-0.001l-0.013,-0.012c1.803,-1.885 4.841,-5.181 10.423,-5.181c20.715,0 27.475,40.776 55.603,40.776c24.857,0 31.834,-20.497 37.286,-31.399c0,0 -8.94,11.12 -21.587,11.12c-27.038,0 -35.323,-40.557 -55.166,-40.557c-13.41,0 -22.743,15.506 -31.029,27.281c0,0 0.018,-0.001 0.048,-0.003c-1.02,1.415 -2.214,3.233 -3.41,5.425c-2.847,5.21 -6.239,13.587 -6.239,23.917c0,22.816 19.801,48.334 46.299,48.334c14.381,0 30.822,-5.84 50.262,-17.858c17.033,-10.529 34.04,-24.246 50.489,-37.511c2.309,-1.862 4.607,-3.715 6.891,-5.549c6.952,30.814 14.606,60.912 33.278,60.912c14.794,0 26.923,-25.445 26.923,-25.445c-7.987,7.101 -13.313,5.621 -13.313,5.621c-13.139,0.379 -19.937,-27.594 -26.48,-56.931c16.455,-12.099 31.46,-20.829 43.488,-20.829l0.072,-0.003c0.082,-0.005 5.246,-0.305 9.957,1.471c-2.95,1.636 -4.947,4.782 -4.947,8.394c0,5.299 4.296,9.594 9.594,9.594c5.298,0 9.594,-4.295 9.594,-9.594c0,-0.826 -0.104,-1.627 -0.301,-2.391Z" style="fill-rule:nonzero;"/></g></svg>',
			),
		);

		const req = {
			headers: fakeForm.getHeaders(),
			is: vi.fn().mockReturnValue(true),
			body: fakeForm.getBuffer(),
			params: {},
			pipe: (input: NodeJS.WritableStream) => stream.pipe(input),
		} as unknown as Request;

		const res = {} as Response;

		const stream = new PassThrough();
		stream.push(fakeForm.getBuffer());

		multipartHandler(req, res, (err) => {
			expect(err.message).toBe('Invalid payload. File is missing filename.');
			expect(err).toBeInstanceOf(InvalidPayloadError);
		});
	});
});
