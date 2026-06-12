<h1 align="center">
  @rack-a-tiers/notification-nodemailer
</h1>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen" alt="node version">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="typescript">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
</p>

<p align="center">
  A Medusa v2 notification provider that sends email via <a href="https://nodemailer.com/">Nodemailer</a> (SMTP).
</p>

> **Internal fork** of [`@perseidesjs/notification-nodemailer`](https://github.com/perseidesjs/notification-nodemailer)
> (MIT, by [adevinwild](https://github.com/adevinwild)), published to a private GCP Artifact Registry
> repo under the `@rack-a-tiers` scope instead of public npm.

## Installation

```bash
pnpm add @rack-a-tiers/notification-nodemailer nodemailer
```

`nodemailer` is a peer dependency — install it alongside. Your `.npmrc` must map the `@rack-a-tiers`
scope to the Artifact Registry repo and carry a valid token
(`npx google-artifactregistry-auth .npmrc`).

## Usage

Register the provider for the `email` channel in `medusa-config.ts`:

```ts
{
  resolve: "@medusajs/medusa/notification",
  options: {
    providers: [
      {
        resolve: "@rack-a-tiers/notification-nodemailer/providers/nodemailer",
        id: "nodemailer",
        options: {
          channels: ["email"],
          from: process.env.NOTIFICATION_PROVIDER_FROM,
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: false, // 587 uses STARTTLS
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      },
    ],
  },
}
```

Then send email anywhere in the app:

```ts
const notificationService = container.resolve(Modules.NOTIFICATION);

await notificationService.createNotifications({
  to: "customer@example.com",
  channel: "email",
  template: "back-in-stock",
  data: { /* template payload */ },
});
```

### Environment variables

```env
NOTIFICATION_PROVIDER_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

## Development

Pinned to Yarn 4 (via `packageManager` + `.yarnrc.yml`); use Corepack.

```bash
corepack enable
yarn install        # omit --immutable on the first install after a rename (it rewrites yarn.lock)
yarn build          # medusa plugin:build → .medusa/server/
yarn dev            # watch mode
yarn typecheck
yarn lint:check
yarn test           # see note below
```

> Integration tests (`service.integration.test.ts`) open a real SMTP connection to `127.0.0.1:1025`
> and fail with `ECONNREFUSED` unless a mail server is running. Start one with
> `docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit`. The unit tests need no server, and
> integration-test failures don't block building or publishing.

## Publishing

Published to a private GCP Artifact Registry npm repo. Requires `artifactregistry.writer` and an
`.npmrc` (git-ignored) with the scope→registry mapping.

```bash
npm version patch                          # AR refuses to republish an existing version
npx google-artifactregistry-auth .npmrc    # mint a short-lived token into .npmrc
npm publish --dry-run                       # verify name, version, registry, tarball contents
npm publish
git push --follow-tags
```

> Build with Yarn, **publish with `npm`** — `npm publish` reads the token from `.npmrc`; Yarn 4 needs
> its own auth config. `npm publish` runs `prepublishOnly` (`medusa plugin:build`) automatically.
> `--dry-run` does not contact the registry, so it won't catch a missing/expired token.

## Syncing with upstream

```bash
git fetch upstream
git checkout develop
git merge upstream/develop
```

Expect conflicts in `package.json`, `CHANGELOG.md`, and (if upstream edits them) the removed workflow
files. Rule of thumb: **keep our `name` / `publishConfig` / `repository`, take their source and
dependency changes**, then reconcile `version`. For a deleted file upstream modified, confirm with
`git rm <file>`.

## License

MIT — see [LICENSE.md](./LICENSE.md). Originally authored by the Perseides team; forked and maintained
internally by Rack-a-Tiers.
