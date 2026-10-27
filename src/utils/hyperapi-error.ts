import { HyperAPIError } from '@hyperapi/core';

/**
 * Converts a HyperAPIError to a Response.
 * @param error - The error to convert.
 * @param should_add_body - Whether to add the response body.
 * @returns -
 */
export function hyperApiErrorToResponse(
	// oxlint-disable-next-line typescript/no-explicit-any
	error: HyperAPIError<any>,
	should_add_body: boolean,
): Response {
	// Copied, not mutated: httpHeaders belongs to the error, which may be reused.
	const headers = new Headers(error.httpHeaders);
	headers.set('Content-Type', 'application/json');

	return new Response(
		should_add_body ? JSON.stringify(error.getResponse()) : undefined,
		{
			status: error.httpStatus,
			headers,
		},
	);
}
