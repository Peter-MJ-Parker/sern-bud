import { EventType, Service, eventModule } from '@sern/handler';

export default eventModule({
	type: EventType.External,
	emitter: 'mongoose',
	name: 'disconnected',
	execute() {
		Service('@sern/logger').error('[DATABASE]- Mongoose connection lost!');
	},
});
