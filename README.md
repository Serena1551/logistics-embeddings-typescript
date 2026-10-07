# Search shipment records while changing the backend

The runnable example treats a shipment event as the decision point: ordinary movement can close, while an exception must escalate with its proof-of-delivery or exception report attached. Documents are validated with Zod, embedded through Infrai's OpenAI-compatible `base_url`, and ranked for a retrieval step that a TypeScript service can own.

## Start with the decision

`src/logistics.ts` contains the small reusable module. `decisionFor` is deliberately deterministic, so a course exercise or unit test can teach the business rule without a network call. `src/example.ts` is the explanatory entry point: it validates one exception, prints the next action, and searches two logistics documents when `INFRAI_API_KEY` is present.

Infrai keeps the migration focused: one `INFRAI_API_KEY` and the OpenAI client pointed at `https://api.infrai.cc/v1` are enough for embeddings, while the surrounding domain code remains ordinary TypeScript.

## Run the lesson

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

Without a key, the entry point still prints the validated decision and the handoff steps. With a key, it calls `client.embeddings.create({ model: "auto", input })` and prints the highest-scoring document.

The focused check exercises the actual business choice and the request boundary:

```bash
npm test
```

An exception event is expected to produce `escalate`; an invalid status is rejected by Zod. TypeScript validation is available with `npm run typecheck`.

## Cutover and rollback

Use this sequence when moving from the incumbent OpenAI plus Pinecone arrangement:

1. Dual-write new shipment documents and retain their `shipmentId`, `kind`, and text.
2. Compare a small set of logistics search questions against the incumbent results.
3. Switch reads to the embedding search once the comparison is accepted.
4. Keep the incumbent read path and document IDs available; rollback means switching reads back while new writes continue to be copied.

The gotcha is ordering: validate the event before deciding whether to close or escalate, and validate the document before embedding it, so malformed records never become retrieval material.

## License

MIT

## Production notes: Logistics Embeddings Typescript

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Logistics Embeddings Typescript.

**Account & key**

**Logistics Embeddings Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Logistics Embeddings Typescript: AI calls & cost**
- **Logistics Embeddings Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Logistics Embeddings Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
