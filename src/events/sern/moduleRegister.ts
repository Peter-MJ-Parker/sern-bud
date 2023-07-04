import {
  EventType,
  LogPayload,
  Payload,
  PayloadType,
  Service,
  eventModule,
} from "@sern/handler";

export default eventModule({
  type: EventType.Sern,
  name: "module.register",
  execute(payload: Payload & { type: PayloadType.Success }) {
    // console.log(Service("@sern/modules").getMetadata(payload.module));
  },
});

