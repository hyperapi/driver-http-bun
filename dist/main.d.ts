import { BaseRecord, EmptyObject, HyperAPIDriver, HyperAPIRequest } from "@hyperapi/core/dev";
import { IP } from "@kirick/ip";

//#region src/request.d.ts
interface HyperAPIBunRequest<A extends BaseRecord = EmptyObject> extends HyperAPIRequest<A> {
  url: URL;
  headers: Headers;
  ip: IP;
}
//#endregion
//#region src/main.d.ts
interface Config {
  port: number;
  path?: string;
  multipart_formdata_enabled?: boolean;
}
declare class HyperAPIBunDriver extends HyperAPIDriver<HyperAPIBunRequest> {
  private port;
  private path;
  private multipart_formdata_enabled;
  private server;
  /**
  * @param options -
  * @param options.port - HTTP server port. Default: `8001`.
  * @param options.path - Path to serve. Default: `/api/`.
  * @param options.multipart_formdata_enabled - If `true`, server would parse `multipart/form-data` requests. Default: `false`.
  */
  constructor({
    port,
    path,
    multipart_formdata_enabled
  }: Config);
  /**
  * Handles the HTTP request.
  * @param request - HTTP request.
  * @param server - Bun server.
  * @returns -
  */
  private processRequest;
  /** Stops the server. */
  destroy(): void;
}
//#endregion
export { HyperAPIBunDriver, type HyperAPIBunRequest };