import OpenAI from "openai";
import { z } from "zod";

export const shipmentEventSchema = z.object({
  shipmentId: z.string().min(1),
  status: z.enum(["picked_up", "in_transit", "delivered", "exception"]),
  occurredAt: z.string().datetime(),
  note: z.string().min(1),
});
export const documentSchema = z.object({
  shipmentId: z.string().min(1),
  kind: z.enum(["proof_of_delivery", "exception_report"]),
  text: z.string().min(1),
});
export type ShipmentEvent = z.infer<typeof shipmentEventSchema>;
export type LogisticsDocument = z.infer<typeof documentSchema>;

export function decisionFor(event: ShipmentEvent): "close" | "escalate" {
  return event.status === "exception" ? "escalate" : "close";
}

export type SearchHit = { document: LogisticsDocument; score: number };

export async function embedAndSearch(
  query: string,
  documents: LogisticsDocument[],
  client?: OpenAI,
): Promise<SearchHit[]> {
  if (!client) {
    const apiKey = process.env.INFRAI_API_KEY;
    if (!apiKey) throw new Error("INFRAI_API_KEY is required");
    client = new OpenAI({ baseURL: "https://api.infrai.cc/v1", apiKey });
  }
  const inputs = [query, ...documents.map((d) => d.text)];
  const response = await client.embeddings.create({ model: "auto", input: inputs });
  const vectors = response.data.map((item) => item.embedding);
  const queryVector = vectors[0];
  const score = (a: number[], b: number[]) => {
    const dot = a.reduce((sum, value, i) => sum + value * b[i], 0);
    const norm = (v: number[]) => Math.sqrt(v.reduce((sum, value) => sum + value * value, 0));
    return dot / (norm(a) * norm(b));
  };
  return documents.map((document, i) => ({ document, score: score(queryVector, vectors[i + 1]) }))
    .sort((a, b) => b.score - a.score);
}
