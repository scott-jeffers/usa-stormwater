/**
 * Deprecated Gemini path removed. Use Cursor agents instead:
 *
 *   1. npm run prepare:queue -- <queue-id>
 *   2. Ask Cursor to read samples/queue/<id>.txt and write data/documents/<id>.json
 *      matching lib/schema.ts (include evidence excerpts).
 *   3. Optional: npm run save -- path/to/draft.json --slug=<id> --url=... 
 *
 * Or ask Cursor to do the whole scrub from data/queue/manifest.json.
 */
console.error(`Gemini ingest has been removed from this project.

Use Cursor agents:
  npm run prepare:queue -- <id>     # download PDF + extract text (no AI key)
  # then ask Cursor to extract structured JSON into data/documents/

See README.md and data/queue/NOTES.md.
`);
process.exit(1);
