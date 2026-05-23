import { HyperAPIError } from '@hyperapi/core';
import { HyperAPIDriver } from '@hyperapi/core/dev';
import { IP } from '@kirick/ip';
import type { Server } from 'bun';
import type { HyperAPIBunRequest } from './request.js';
import { isHttpMethodSupported, isResponseBodyRequired } from './utils/http.js';
import { hyperApiErrorToResponse } from './utils/hyperapi-error.js';
import { parseArguments, type RequestArgs } from './utils/parse.js';

interface Config<P extends boolean = true> {
	port?: number;
	path?: string;
	multipart_formdata_enabled?: boolean;
	parse_body?: P;
}

export class HyperAPIBunDriver<P extends boolean = true> extends HyperAPIDriver<
	HyperAPIBunRequest<P, RequestArgs>
> {
	#path_prefix: string;
	private multipart_formdata_enabled: boolean;
	private parse_body: P;
	#server: Server<unknown> | undefined;

	/**
	 * @param options -
	 * @param options.port - HTTP server port. If not provided, server will not be started, you should start it manually.
	 * @param options.path - Path to serve. Default: `/api/`.
	 * @param options.multipart_formdata_enabled - If `true`, server would parse `multipart/form-data` requests. Default: `false`.
	 * @param options.parse_body - If `true`, server would parse requests. Default: `true`.
	 */
	constructor({
		port,
		path = '/',
		multipart_formdata_enabled = false,
		parse_body = true as P,
	}: Config<P>) {
		super();

		this.#path_prefix = path.replace(/\/$/u, '');
		this.multipart_formdata_enabled = multipart_formdata_enabled;
		this.parse_body = parse_body;

		if (port !== undefined) {
			this.#server = Bun.serve({
				development: process.env.NODE_ENV !== 'production',
				port,
				fetch: this.handler.bind(this),
			});
		}
	}

	async handler(request: Request, server: Server<unknown>): Promise<Response> {
		try {
			return await this.processRequest(request, server);
		} catch (error) {
			if (error instanceof HyperAPIError) {
				return hyperApiErrorToResponse(
					error,
					isResponseBodyRequired(request.method),
				);
			}

			// oxlint-disable-next-line no-console
			console.error('Unhandled error in @hyperapi/driver-bun:');
			// oxlint-disable-next-line no-console
			console.error(error);

			return new Response(undefined, { status: 500 });
		}
	}

	/**
	 * Handles the HTTP request.
	 * @param request - HTTP request.
	 * @param server - Bun server.
	 * @returns -
	 */
	private async processRequest(
		request: Request,
		server: Server<unknown>,
	): Promise<Response> {
		const socket_address = server.requestIP(request);
		if (socket_address === null) {
			throw new Error('Cannot get IP address from request.');
		}

		let http_method = request.method;
		if (isHttpMethodSupported(http_method) !== true) {
			return new Response(undefined, { status: 405 });
		}

		if (http_method === 'HEAD') {
			http_method = 'GET';
		}

		const url = new URL(request.url, 'http://hyperapi');
		let hyperapi_path;
		if (url.pathname === this.#path_prefix) {
			hyperapi_path = '/';
		} else if (url.pathname.startsWith(`${this.#path_prefix}/`)) {
			hyperapi_path = url.pathname.slice(this.#path_prefix.length);
		} else {
			return new Response(undefined, { status: 404 });
		}

		const hyperapi_request_base = {
			method: http_method,
			path: hyperapi_path,
			url: url as URL,
			headers: request.headers,
			ip: new IP(socket_address.address),
		};

		let hyperapi_request: HyperAPIBunRequest<P, RequestArgs>;
		if (this.parse_body) {
			const hyperapi_args = await parseArguments(
				request,
				url as URL,
				this.multipart_formdata_enabled,
			);

			hyperapi_request = {
				...hyperapi_request_base,
				args: hyperapi_args,
			} as HyperAPIBunRequest<P, RequestArgs>;
		} else {
			hyperapi_request = {
				...hyperapi_request_base,
				args: {},
				request,
			} as HyperAPIBunRequest<P, RequestArgs>;
		}

		const hyperapi_response = await this.emitRequest(hyperapi_request);

		if (hyperapi_response instanceof HyperAPIError) {
			throw hyperapi_response;
		}

		if (hyperapi_response instanceof Response) {
			return hyperapi_response;
		}

		return new Response(
			isResponseBodyRequired(http_method)
				? JSON.stringify(hyperapi_response)
				: undefined,
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}

	/** Stops the server. */
	override async destroy(): Promise<void> {
		await this.#server?.stop(true);

		super.destroy();
	}
}

export type {
	HyperAPIBunRequest,
	HyperAPIBunRequestWithArgs,
	HyperAPIBunRequestWithRequest,
} from './request.js';
