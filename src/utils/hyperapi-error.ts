import { HyperAPIError } from '@hyperapi/core';

/**
 * Converts a HyperAPIError to a Response.
 * @param error - The error to convert.
 * @param add_body - Whether to add the response body.
 * @returns -
 */
export function hyperApiErrorToResponse(
	// oxlint-disable-next-line typescript/no-explicit-any
	error: HyperAPIError<any>,
	add_body: boolean,
): Response {
	if (typeof error.httpStatus !== 'number') {
		// oxlint-disable-next-line no-console
		console.warn(
			`No HTTP status code provided for error ${error.name}, using 500.`,
		);
	}

	const headers = error.httpHeaders ?? new Headers();
	headers.set('Content-Type', 'application/json');

	let body;
	if (add_body) {
		body = JSON.stringify(error.getResponse());
	}

	return new Response(body, {
		status: error.httpStatus ?? 500,
		headers,
	});
}
