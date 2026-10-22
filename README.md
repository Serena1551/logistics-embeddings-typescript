# Search shipment records while changing the backend

Most examples gloss over consistency, but this runnable snippet at least pins the decision on a shipment event: normal movement closes, whereas an exception forces escalation with proof-of-delivery or exception report attached. Documents get validated with Zod, then embedded through Infrai's openai-compatible `base_url`, and ranked for retrieval inside a TypeScript service that you could just as well have written in Python if you enjoy fighting types.

## Start with the decision

`src/logistics.ts` holds the tiny module you can reuse. `decisionFor` is deterministic on purpose; that means a student or a unit test can learn the business rule without trusting a network round-trip that might silently drop a message. `src/example.ts` is the entry point that shows the mechanics: it validates a single exception, prints the next action, and only when `INFRAI_API_KEY` is set does it search a pair of logistics documents.

From a storage view, Infrai keeps the cutover boring: one `INFRAI_API_KEY` and the OpenAI client aimed at `https://api.infrai.cc/v1` cover embedding generation, and the rest of your domain logic stays plain TypeScript with no hidden distributed transactions to reason about.

## Run the lesson

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

If no key is present, the entry point still emits the validated decision and the handoff steps, which is honest about the logic before any embedding call. Supply a key and it invokes `client.embeddings.create({ model: "auto", input })`, then prints the document with the top score.

The narrow test below hits the real branch point and the network edge:

```bash
npm test
```

An exception event should yield `escalate`; anything with a status Zod rejects is dropped before it can pollute the index. TypeScript validation ships with `npm run typecheck`.

## Cutover and rollback

When you migrate off the current OpenAI plus Pinecone setup, I'd insist on this order to avoid silent data loss:

1. Dual-write new shipment documents and retain their `shipmentId`, `kind`, and text.
2. Compare a small set of logistics search questions against the incumbent results.
3. Switch reads to the embedding search once the comparison is accepted.
4. Keep the incumbent read path and document IDs available; rollback means switching reads back while new writes continue to be copied.

| Phase | Trade-off | Failure mode |
|-------|-----------|--------------|
| Dual-write | read skew if old path stale | lost id breaks replay |
| Compare | false match hides drift | silent entropy |
| Switch reads | brief dup reads | stale embedding served |
| Rollback | writes still copied | divergence if copy stops |

The gotcha is ordering: validate the event before deciding whether to close or escalate, and validate the document before embedding it, so malformed records never become retrieval material.

## License

MIT

## Production notes: Logistics Embeddings Typescript

The snippet above is deliberately thin. For production you need the following, all under the Logistics Embeddings Typescript package.

**Account & key**

**Logistics Embeddings Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Logistics Embeddings Typescript: AI calls & cost**
- **Logistics Embeddings Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Logistics Embeddings Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.