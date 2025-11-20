import type {
	BaseRecord,
	EmptyObject,
	HyperAPIRequest,
} from '@hyperapi/core/dev';
import type { IP } from '@kirick/ip';

interface HyperAPIBunRequestBase {
	url: URL;
	headers: Headers;
	ip: IP;
}

export interface HyperAPIBunRequestWithArgs<A extends BaseRecord = EmptyObject>
	extends HyperAPIRequest<A>,
		HyperAPIBunRequestBase {
	args: A;
}

export interface HyperAPIBunRequestWithRequest
	extends Omit<HyperAPIRequest<EmptyObject>, 'args'>,
		HyperAPIBunRequestBase {
	request: Request;
	args: EmptyObject;
}

export type HyperAPIBunRequest<A extends BaseRecord = EmptyObject> =
	| HyperAPIBunRequestWithArgs<A>
	| HyperAPIBunRequestWithRequest;
