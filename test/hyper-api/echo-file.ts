import * as v from 'valibot';
import { hyperApi, valibot } from '../setup.js';

export default hyperApi
	.module()
	.use(valibot(v.object({ name: v.file() })))
	.action(async (request) => {
		const name = await request.args.name.text();

		return {
			method: 'ALL',
			message: `Hello, ${name}!`,
		};
	});
