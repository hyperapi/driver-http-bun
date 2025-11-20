import { HyperAPIInvalidParametersError } from '@hyperapi/core';
import * as v from 'valibot';
import type { HyperAPIBunRequestWithRequest } from '../../src/request.js';
import {
	generateHmacSha256,
	hyperApiWithoutParse,
	type ValiBaseSchema,
} from '../setup.js';
import { HyperAPIInvalidSignature } from './error.js';

export const SECRET = 'secret';

export default hyperApiWithoutParse
	.module()
	.use(validateSignature())
	.use(valibot(v.object({ name: v.string() })))
	.action((request) => {
		return {
			method: 'echo-sign',
			message: `Hello, ${request.args.name}!`,
		};
	});

/**
 * Validate signature
 * @returns - True if the signature is valid, false otherwise
 */
function validateSignature() {
	return async (request: HyperAPIBunRequestWithRequest) => {
		const cloned_request = request.request.clone();
		const buffer = await cloned_request.arrayBuffer();

		const decoder = new TextDecoder();
		const text = decoder.decode(buffer);
		const sign = generateHmacSha256(SECRET, text);
		const expected_sign = request.headers.get('X-Signature');
		const valid = expected_sign === sign;

		if (!valid) {
			throw new HyperAPIInvalidSignature();
		}

		return {};
	};
}

/**
 * Valibot validator for HyperAPI requests without parse.
 * @param schema - The Valibot schema to validate the request against.
 * @returns A middleware function that validates the request arguments using the provided schema.
 */
function valibot<S extends ValiBaseSchema>(schema: S) {
	return async (request: HyperAPIBunRequestWithRequest) => {
		const args = await request.request.json();
		const result = v.safeParse(schema, args);
		if (result.success) {
			return { args: result.output };
		}

		throw new HyperAPIInvalidParametersError();
	};
}
