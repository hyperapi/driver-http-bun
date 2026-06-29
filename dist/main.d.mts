import { EmptyObject, HyperAPIDriver, HyperAPIRequest, UnknownRecord } from "@hyperapi/core/dev";
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
declare class HyperAPIBunDriver<P extends boolean = true> extends HyperAPIDriver<HyperAPIBunRequest<P, RequestArgs>> {
  #private;
  private multipart_formdata_enabled;
  private parse_body;
  /**
  * @param options -
  * @param options.port - HTTP server port. If not provided, server will not be started, you should start it manually.
  * @param options.path - Path to serve. Default: `/api/`.
  * @param options.multipart_formdata_enabled - If `true`, server would parse `multipart/form-data` requests. Default: `false`.
  * @param options.parse_body - If `true`, server would parse requests. Default: `true`.
  */
  constructor({
    port,
    path,
    multipart_formdata_enabled,
    parse_body
  }: Config<P>);
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
export { HyperAPIBunDriver, type HyperAPIBunRequest, type HyperAPIBunRequestWithArgs, type HyperAPIBunRequestWithRequest };