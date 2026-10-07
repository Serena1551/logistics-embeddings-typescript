import { documentSchema, shipmentEventSchema, decisionFor, embedAndSearch } from "./logistics.js";

const event = shipmentEventSchema.parse({ shipmentId: "SHP-204", status: "exception", occurredAt: "2025-01-15T10:00:00Z", note: "Dock closed on arrival" });
const documents = [
  documentSchema.parse({ shipmentId: "SHP-204", kind: "exception_report", text: "Dock closed on arrival; contact receiver before redelivery." }),
  documentSchema.parse({ shipmentId: "SHP-199", kind: "proof_of_delivery", text: "Signed by A. Chen at receiving desk." }),
];
console.log({ shipmentId: event.shipmentId, nextAction: decisionFor(event), migration: ["dual write documents", "compare search results", "switch reads", "retain incumbent rollback"] });
if (process.env.INFRAI_API_KEY) {
  const hits = await embedAndSearch("receiver unavailable at delivery", documents);
  console.log(hits[0]);
} else {
  console.log("Set INFRAI_API_KEY to run the embeddings search.");
}
