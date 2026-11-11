# Capture workflow

How authentic product footage gets into a film, and the rules it follows.

## What gets captured

Two flows, two kinds of artefact.

| Flow | Surface | Produces |
| --- | --- | --- |
| `marketview-client` | The MarketView client reference build | 12 screenshots + named regions |
| `marketview-rep-whatsapp` | The Rep's WhatsApp preview console, running live | A conversation transcript + 2 provenance screenshots |
| `marketview-rep-agribusiness` | The same console, from a Nigerian agribusiness buyer | Two transcripts (English, Hausa) + 2 provenance screenshots |

Both write to `public/assets/`, and both are committed: a film must be
reproducible without re-driving a browser.

## Provenance, stated plainly

### Product screenshots

Driven from `marketview_dashboard.html` in the MarketView repository: a
single-file, client-only copy of the client dashboard that runs on bundled
fixture data. No production API, no credentials, no customer records.

The interface, layout, typography, colour and copy are the real product. **The
numbers and names in it are fixtures.** The films disclose this on screen.

### The Rep conversation

Driven from `services/rep-chatbot/public/wa-preview.html` with the service
running against **Vertex AI (`gemini-2.5-flash`)** and its Postgres data layer
loaded with the seeded demo market data. The console uses reserved simulator
numbers that the service never forwards to Meta.

**Every word the Rep says in the film is a word the live model actually
produced.** The transcript records the engine string it reported.

## Running a capture

### Product screenshots

```bash
npm run capture
# or, if the product lives elsewhere:
MARKETVIEW_REPO=/path/to/marketview npm run capture
```

### The Rep conversation

This one needs a running service and spends live model calls, so it is not part
of `npm run capture`. Start the stack first:

```bash
# 1. The Rep's data layer (host port 15432). Without it the Rep answers
#    honestly that it has no price data, which makes for a poor film.
cd /path/to/marketview
docker compose up -d rep-postgres

# 2. The Rep, with live AI and NO outbound side effects.
#    Note what is deliberately absent: no WhatsApp token, no SMS provider key.
#    SMS_PROVIDER defaults to 'fake', so nothing can be sent.
cd services/rep-chatbot
GOOGLE_GENAI_USE_VERTEXAI=true \
GOOGLE_CLOUD_PROJECT=<project> GOOGLE_CLOUD_LOCATION=<region> \
GOOGLE_APPLICATION_CREDENTIALS=<path to service account json> \
GEMINI_MODEL=gemini-2.5-flash GEMINI_ENABLED=true \
DATABASE_URL="postgres://marketview:secret@localhost:15432/marketview_rep" \
SEED_DEMO_DATA=true \
PORT=3100 WHATSAPP_SIMULATOR=true ADMIN_API_TOKEN=dev \
CONFIG_OVERLAY_PATH=/tmp/rep-preview-config.json \
npx tsx src/server.ts

# 3. Record a conversation.
cd /path/to/anthias
REP_ADMIN_TOKEN=<the service's ADMIN_API_TOKEN> npm run capture:rep
REP_ADMIN_TOKEN=<…> npm run capture:rep:agri     # the campaign conversations
```

### Three ways this fails silently, and what each looks like

All three were hit while capturing the campaign films. Each one now raises an
error instead, but they are worth recognising.

**`WHATSAPP_SIMULATOR=true` is not optional.** Without it the service does not
mount its simulator routes at all, and every console call 404s. A stack brought
up with `docker compose` for ordinary development usually does *not* set it —
check before assuming the console is broken:

```bash
curl -s -H "Authorization: Bearer $REP_ADMIN_TOKEN" localhost:3100/admin/wa-sim
# {"enabled":true,"provider":"fake"}   ← what you want
```

If the development stack cannot be restarted, start a second instance on
another port against the same Postgres and a *different* Redis database. That
is what the campaign capture did, and it leaves the running stack untouched.

**The admin token is rarely `dev`.** `REP_ADMIN_TOKEN` defaults to `dev`, which
is right for a hand-started service and wrong for one started from a compose
file. A wrong token makes the console hide its whole UI behind a notice; the
flow used to carry on against a dead page and write an empty transcript.
`RepConsole.connect()` now re-raises the notice as an error.

**The typing indicator is also an outbound row.** The console draws
`<div class="row out"><div class="bubble typing">` the moment a turn is in
flight, so "wait until the last row is outbound" is satisfied by three bouncing
dots. The driver then races ahead and the console silently drops every
subsequent send, because its own `send()` returns early while a turn is in
flight. `waitForReply` now excludes the typing bubble.

### Outbound side effects: read this before adding a question

The console states it plainly: *"Messages to other people (a seller being told a
buyer wants to connect, SMS) still go out as they would on this environment."*

`WHATSAPP_PROVIDER=fake` stops WhatsApp messages. It does **not** stop SMS —
that is `SMS_PROVIDER`, and a development stack often has a live provider
configured there. Asking the Rep to connect you to a seller, tapping "confirm
1", or answering yes to an introduction prompt can therefore put a real text
message in a real person's hand.

Every question in every committed flow is read-only: price lookups, market
comparisons, language. Keep it that way, and set `SMS_PROVIDER=fake` explicitly
on any service you start for a capture.

### When the simulator runs out of numbers

The simulator hands out one number per "New stranger" and the Rep remembers
each. The doc's blunt fix truncates the whole session store, which also
discards real development history. Prefer deleting only the reserved simulator
numbers:

```sql
delete from chat_messages where session_id in (
  select session_id from chat_sessions
  where phone like '%23470000000%' or phone like '%2547000000%');
delete from chat_sessions
  where phone like '%23470000000%' or phone like '%2547000000%';
```

**Sessions persist.** The simulator hands out a fresh number per "New stranger"
and runs out after enough captures. When the flow reports *"Could not reach an
empty thread"*:

```bash
docker exec $(docker ps -qf name=rep-postgres) \
  psql -U marketview -d marketview_rep \
  -c "truncate chat_sessions, chat_messages restart identity cascade;"
```

A partial run merges into the manifest by capture id, so `--only` refreshes one
flow without destroying the others.

## Determinism

A flow run twice should produce the same pixels.

- **Frozen clock.** `page.clock.setFixedTime` pins `Date.now()` so freshness
  badges and "today" labels do not drift. Opt out per flow with
  `freezeClock: false` — the chat console re-enables its controls on a timer and
  a frozen clock leaves them disabled for ever.
- **No CSS animation.** Injected CSS zeroes every duration and delay.
  Leaflet is the exception that proves the rule: it fades tiles in with an
  opacity transition, and freezing transitions strands them at opacity 0 and
  renders a blank map. There is an explicit override for it.
- **Explicit readiness, never `sleep`.** `settleMap` waits for every Leaflet
  tile to carry `leaflet-tile-loaded`; the Rep driver polls for a new outbound
  row rather than guessing how long a live model takes.
- **Fixed viewport and DPR.** 1512×945 at 2×, giving 3024×1890 captures — ample
  headroom for pushing in on a 1920-wide film.

## Named regions

The contract between capture and film.

```ts
await ctx.shot("trade-pricing", {
  regions: { buy: ".tp-card-buy", cheapest: ".tp-card-cheap" },
});
```

The bounding box of each selector is stored as a rect in 0–1 coordinates. A
scene then says `to: { region: "buy", pad: 0.14 }`. Rename the element in the
product and the next render **fails with the region name**, instead of quietly
framing the wrong part of the screen.

`getRegion` throws rather than falling back. That is deliberate.

## Privacy

The capture pipeline treats a screenshot as a publication.

1. **Redact before shooting.** Immediately before every screenshot, the DOM is
   walked and email addresses, phone numbers and API tokens are replaced with
   neutral placeholders. The pixels never contain the original value. The two
   published product contact addresses are allow-listed.
2. **Scan after redacting.** Anything still matching fails the run with a
   non-zero exit code, and the manifest records the result.
3. **Avoid the surfaces that cannot be made safe.** The Team panel and
   close-ups of the actor roster are deliberately not used. The roster is a list
   of people; even with fixture names, a tight shot of it looks like exposing a
   customer's contacts.
4. **No credentials in this repository.** The Rep flow reads its admin token
   from `REP_ADMIN_TOKEN` (local dev default `dev`).
5. **No outbound side effects.** The Rep flow never triggers a connect or an
   introduction, because those send a real SMS.

`npm test` asserts the committed manifest is clean.

## Adding a flow

1. Write `capture/flows/<name>.ts` exporting a `Flow`.
2. Register it in `ALL_FLOWS` in `capture/run.ts`.
3. Declare the regions scenes will need.
4. Run it, look at the PNGs, and check the privacy result.
