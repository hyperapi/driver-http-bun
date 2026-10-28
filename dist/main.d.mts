import { EmptyObject, HyperAPIDriver, HyperAPIModuleResponse, HyperAPIRequest, UnknownRecord } from "@hyperapi/core/dev";
import { IP } from "@kirick/ip";

//#region src/request.d.ts
interface HyperAPIBunRequestBase {
  url: URL;
  headers: Headers;
  ip: IP;
}
interface HyperAPIBunRequestWithArgs<A extends UnknownRecord = EmptyObject> extends HyperAPIRequest<A>, HyperAPIBunRequestBase {
  args: A;
}
interface HyperAPIBunRequestWithRequest extends HyperAPIRequest<EmptyObject>, HyperAPIBunRequestBase {
  request: Request;
}
type HyperAPIBunRequest<P extends boolean = true, A extends UnknownRecord = EmptyObject> = P extends true ? HyperAPIBunRequestWithArgs<A> : HyperAPIBunRequestWithRequest;
//#endregion
//#region src/response.d.ts
/** HTTP can carry a raw `Response` on top of what every transport carries. */
type HyperAPIBunResponse = HyperAPIModuleResponse | Response;
//#endregion
//#region src/utils/parse.d.ts
type RequestArgs = Record<string, unknown>;
//#endregion
//#region src/main.d.ts
interface Config<P extends boolean = true> {
  port?: number;
  path?: string;
  multipart_formdata_enabled?: boolean;
  parse_body?: P;
}
declare class HyperAPIBunDriver<P extends boolean = true> extends HyperAPIDriver<HyperAPIBunRequest<P, RequestArgs>, HyperAPIBunResponse> {
  #private;
  /**
  * @param options -
  * @param options.port - HTTP server port. If not provided, server will not be started, you should start it manually.
  * @param options.path - Path to serve. Default: `/`.
  * @param options.multipart_formdata_enabled - If `true`, server would parse `multipart/form-data` requests. Default: `false`.
  * @param options.parse_body - If `true`, server would parse requests. Default: `true`.
  */
  constructor({
    port,
    path,
    multipart_formdata_enabled,
    parse_body
  }: Config<P>);
  /**
  * Accepts anything HTTP can carry: this transport adds a raw `Response` to
  * the core floor.
  * @param response - The value a module returned.
  * @returns -
  */
  override isValidResponse(response: unknown): response is HyperAPIBunResponse;
  handler(request: Request, server: Bun.Server<unknown>): Promise<Response>;
  /**
  * Handles the HTTP request.
  * @param request - HTTP request.
  * @param server - Bun server.
  * @returns -
  */
  private processRequest;
  /** Stops the server. */
  override destroy(): Promise<void>;
}
//#endregion
export { HyperAPIBunDriver, type HyperAPIBunRequest, type HyperAPIBunRequestWithArgs, type HyperAPIBunRequestWithRequest, type HyperAPIBunResponse };