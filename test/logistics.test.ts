import assert from "node:assert/strict";
import { decisionFor, shipmentEventSchema } from "../src/logistics.js";

const event = shipmentEventSchema.parse({ shipmentId: "SHP-1", status: "exception", occurredAt: "2025-01-01T00:00:00Z", note: "No receiver" });
assert.equal(decisionFor(event), "escalate");
assert.throws(() => shipmentEventSchema.parse({ shipmentId: "SHP-1", status: "lost", occurredAt: "2025-01-01T00:00:00Z", note: "No receiver" }));
console.log("logistics decision test passed");
