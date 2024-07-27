import {
  EventType,
  Payload,
  PayloadType,
  Service,
  eventModule,
} from "@sern/handler";

export default eventModule({
  type: EventType.Sern,
  name: "module.activate",
  execute(payload: Payload & { type: PayloadType.Success }) {
    // console.log(Service("@sern/modules"));
  },
});

