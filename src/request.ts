import type {
	EmptyObject,
	HyperAPIRequest,
	UnknownRecord,
} from '@hyperapi/core/dev';
import type { IP } from '@kirick/ip';

interface HyperAPIBunRequestBase {
	url: URL;
	headers: Headers;
	ip: IP;
}

export interface HyperAPIBunRequestWithArgs<
	A extends UnknownRecord = EmptyObject,
> extends HyperAPIRequest<A>,
		HyperAPIBunRequestBase {
	args: A;
}

export interface HyperAPIBunRequestWithRequest
	extends HyperAPIRequest<EmptyObject>,
		HyperAPIBunRequestBase {
	request: Request;
}

export type HyperAPIBunRequest<
	P extends boolean = true,
	A extends UnknownRecord = EmptyObject,
> = P extends true
	? HyperAPIBunRequestWithArgs<A>
	: HyperAPIBunRequestWithRequest;
