import { HyperAPIError, HyperAPIInvalidParametersError } from "@hyperapi/core";
import { IP } from "@kirick/ip";

//#region src/utils/is-record.ts
/**
* Check if a value is a record.
* @param value -
* @returns -
*/
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) && value.constructor === Object && Object.prototype.toString.call(value) === "[object Object]";
}

//#endregion
//#region src/utils/parse.ts
/**
* Gets only MIME type from Content-Type header, stripping parameters.
* @param  type - MIME type.
* @returns  - MIME type.
*/
function getMIME(type) {
	const index = type.indexOf(";");
	if (index !== -1) return type.slice(0, index).trim();
	return type.trim();
}
var HyperAPIBodyInvalidError = class extends HyperAPIInvalidParametersError {
	data = { message: "Could not parse body" };
	httpStatus = 400;
	constructor(message) {
		super();
		if (message) this.data.message = message;
	}
};
var HyperAPIBodyUnknownError = class extends HyperAPIInvalidParametersError {
	data = { message: "Unsupported body type" };
	httpStatus = 415;
	constructor(mime) {
		super();
		this.data.message = `Unsupported body type: ${mime}`;
	}
};
/**
* Parses arguments from request.
* @param  request - Request object.
* @param  url - URL object.
* @param  multipart_formdata_enabled - Whether to enable multipart/form-data parsing.
* @returns - Arguments.
*/
async function parseArguments(request, url, multipart_formdata_enabled) {
	let args = {};
	if (request.method === "GET" || request.method === "HEAD") args = Object.fromEntries(url.searchParams.entries());
	else if (request.body) {
		const type_header = request.headers.get("Content-Type");
		const type_mime = type_header === null ? "<no Content-Type header provided>" : getMIME(type_header);
		switch (type_mime) {
			case "application/json":
				{
					let args_json;
					try {
						args_json = await request.json();
					} catch {
						throw new HyperAPIBodyInvalidError();
					}
					if (isRecord(args_json) !== true) throw new HyperAPIBodyInvalidError("JSON body must be an object");
					args = args_json;
				}
				break;
			case "multipart/form-data":
				if (multipart_formdata_enabled !== true) throw new HyperAPIBodyUnknownError(type_mime);
				try {
					const formdata = await request.formData();
					args = Object.fromEntries(formdata.entries());
				} catch {
					throw new HyperAPIInvalidParametersError();
				}
				break;
			case "application/x-www-form-urlencoded":
				try {
					args = Object.fromEntries(new URLSearchParams(await request.text()));
				} catch {
					throw new HyperAPIInvalidParametersError();
				}
				break;
			default: throw new HyperAPIBodyUnknownError(type_mime);
		}
	}
	return args;
}

//#endregion
//#region src/utils/hyperapi-error.ts
/**
* Converts a HyperAPIError to a Response.
* @param error - The error to convert.
* @param add_body - Whether to add the response body.
* @returns -
*/
function hyperApiErrorToResponse(error, add_body) {
	if (typeof error.httpStatus !== "number") console.warn(`No HTTP status code provided for error ${error.name}, using 500.`);
	const headers = new Headers();
	headers.set("Content-Type", "application/json");
	if (error.httpHeaders) for (const [header, value] of Object.entries(error.httpHeaders)) headers.set(header, value);
	let body;
	if (add_body) body = JSON.stringify(error.getResponse());
	return new Response(body, {
		status: error.httpStatus ?? 500,
		headers
	});
}

//#endregion
//#region src/utils/http.ts
/**
* Checks if the response body is required for the given HTTP method.
* @param http_method The HTTP method to check.
* @returns -
*/
function isHttpMethodSupported(http_method) {
	return http_method === "GET" || http_method === "POST" || http_method === "PUT" || http_method === "PATCH" || http_method === "DELETE" || http_method === "HEAD" || http_method === "OPTIONS";
}
/**
* Checks if the response body is required for the given HTTP method.
* @param http_method The HTTP method to check.
* @returns -
*/
function isResponseBodyRequired(http_method) {
	return http_method !== "HEAD" && http_method !== "OPTIONS";
}

//#endregion
//#region src/main.ts
var HyperAPIBunDriver = class {
	handler = null;
	port;
	path;
	multipart_formdata_enabled;
	server = null;
	/**
	* @param options -
	* @param options.port - HTTP server port. Default: `8001`.
	* @param [options.path] - Path to serve. Default: `/api/`.
	* @param [options.multipart_formdata_enabled] - If `true`, server would parse `multipart/form-data` requests. Default: `false`.
	*/
	constructor({ port, path = "/api/", multipart_formdata_enabled = false }) {
		this.port = port;
		this.path = path;
		this.multipart_formdata_enabled = multipart_formdata_enabled;
	}
	/**
	* Starts the server.
	* @param handler - The handler to use.
	*/
	start(handler) {
		this.handler = handler;
		this.server = Bun.serve({
			development: false,
			port: this.port,
			fetch: async (request, server) => {
				try {
					return await this.processRequest(request, server);
				} catch (error) {
					if (error instanceof HyperAPIError) return hyperApiErrorToResponse(error, isResponseBodyRequired(request.method));
					console.error("Unhandled error in @hyperapi/driver-bun:");
					console.error(error);
					return new Response(void 0, { status: 500 });
				}
			}
		});
	}
	/** Stops the server. */
	stop() {
		this.server?.stop();
	}
	/**
	* Handles the HTTP request.
	* @param request - HTTP request.
	* @param server - Bun server.
	* @returns -
	*/
	async processRequest(request, server) {
		if (!this.handler) throw new Error("No handler available.");
		const socket_address = server.requestIP(request);
		if (socket_address === null) throw new Error("Cannot get IP address from request.");
		const http_method = request.method;
		if (isHttpMethodSupported(http_method) !== true) return new Response(void 0, { status: 405 });
		const url = new URL(request.url);
		if (url.pathname.startsWith(this.path) !== true) return new Response(void 0, { status: 404 });
		const hyperapi_method = url.pathname.slice(this.path.length);
		const hyperapi_args = await parseArguments(request, url, this.multipart_formdata_enabled);
		const hyperapi_response = await this.handler({
			method: http_method,
			path: hyperapi_method,
			args: hyperapi_args,
			url,
			headers: request.headers,
			ip: new IP(socket_address.address)
		});
		if (hyperapi_response instanceof HyperAPIError) throw hyperapi_response;
		if (hyperapi_response instanceof Response) return hyperapi_response;
		return new Response(isResponseBodyRequired(http_method) ? JSON.stringify(hyperapi_response) : void 0, {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	}
};

//#endregion
export { HyperAPIBunDriver };