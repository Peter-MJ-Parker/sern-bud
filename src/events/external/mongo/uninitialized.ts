import { EventType, Service, eventModule } from '@sern/handler';

export default eventModule({
	type: EventType.External,
	emitter: 'mongoose',
	name: 'uninitialized',
	execute() {
		Service('@sern/logger').debug(
			'[DATABASE]- Mongoose has not been initialized.'
		);
	},
});
