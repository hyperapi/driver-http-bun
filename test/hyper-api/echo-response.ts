/* eslint-disable jsdoc/require-jsdoc */

import type { HyperAPIResponse } from '@hyperapi/core';
import type { HyperAPIBunRequest } from '../../src/main.js';

export default function (request: HyperAPIBunRequest<{ name: string }>): HyperAPIResponse {
	return new Response(
		`Hello, ${request.args.name}!`,
		{
			status: 200,
			headers: {
				'Content-Type': 'text/plain',
			},
		},
	);
}
