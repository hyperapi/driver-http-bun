import { HyperAPIError } from '@hyperapi/core';
import { HyperAPIDriver } from '@hyperapi/core/dev';
import { IP } from '@kirick/ip';
import type { Server } from 'bun';
import type { HyperAPIBunRequest } from './request.js';
import { isHttpMethodSupported, isResponseBodyRequired } from './utils/http.js';
import { hyperApiErrorToResponse } from './utils/hyperapi-error.js';
import { parseArguments, type RequestArgs } from './utils/parse.js';

interface Config<P extends boolean = true> {
	port: number;
	path?: string;
	multipart_formdata_enabled?: boolean;
	parse_body?: P;
}

export class HyperAPIBunDriver<P extends boolean = true> extends HyperAPIDriver<
	HyperAPIBunRequest<P, RequestArgs>
> {
	private port: number;
	private path: string;
	private multipart_formdata_enabled: boolean;
	private parse_body: P;
	private server: Server;

	/**
	 * @param options -
	 * @param options.port - HTTP server port. Default: `8001`.
	 * @param options.path - Path to serve. Default: `/api/`.
	 * @param options.multipart_formdata_enabled - If `true`, server would parse `multipart/form-data` requests. Default: `false`.
	 * @param options.parse_body - If `true`, server would parse requests. Default: `true`.
	 */
	constructor({
		port,
		path = '/api/',
		multipart_formdata_enabled = false,
		parse_body = true as P,
	}: Config<P>) {
		super();

		this.port = port;
		this.path = path;
		this.multipart_formdata_enabled = multipart_formdata_enabled;
		this.parse_body = parse_body;

		this.server = Bun.serve({
			development: false,
			port: this.port,
			fetch: async (request, server) => {
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
			},
		});
	}

	/**
	 * Handles the HTTP request.
	 * @param request - HTTP request.
	 * @param server - Bun server.
	 * @returns -
	 */
	private async processRequest(
		request: Request,
		server: Server,
	): Promise<Response> {
		const socket_address = server.requestIP(request);
		if (socket_address === null) {
			throw new Error('Cannot get IP address from request.');
		}

		const http_method = request.method;
		if (isHttpMethodSupported(http_method) !== true) {
			return new Response(undefined, { status: 405 });
		}

		const url = new URL(request.url);
		if (url.pathname.startsWith(this.path) !== true) {
			return new Response(undefined, { status: 404 });
		}

		const hyperapi_method = url.pathname.slice(this.path.length);

		const base_body = {
			method: http_method,
			path: hyperapi_method,
			url: url as URL,
			headers: request.headers,
			ip: new IP(socket_address.address),
		};

		let body: HyperAPIBunRequest<P, RequestArgs>;
		if (this.parse_body) {
			const hyperapi_args = await parseArguments(
				request,
				url as URL,
				this.multipart_formdata_enabled,
			);

			body = {
				...base_body,
				args: hyperapi_args,
			} as HyperAPIBunRequest<P, RequestArgs>;
		} else {
			body = {
				...base_body,
				args: {},
				request,
			} as HyperAPIBunRequest<P, RequestArgs>;
		}

		const hyperapi_response = await this.emitRequest(body);

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
	override destroy(): void {
		this.server.stop();

		super.destroy();
	}
}

export type { HyperAPIBunRequest } from './request.js';
