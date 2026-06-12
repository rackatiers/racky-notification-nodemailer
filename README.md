<h1 align="center">
  @rack-a-tiers/notification-nodemailer
</h1>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen" alt="node version">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="typescript">
  <img src="https://img.shields.io/badge/registry-Artifact%20Registry-4285F4" alt="artifact registry">
</p>

<p align="center">
  A Medusa v2 plugin for sending notifications via Nodemailer (SMTP).
</p>

> **Fork notice.** This is the Rack-a-Tiers internal fork of
> [`@perseidesjs/notification-nodemailer`](https://github.com/perseidesjs/notification-nodemailer)
> (MIT, by [adevinwild](https://github.com/adevinwild)). It is published to the private
> **GCP Artifact Registry** repo `racky-store-packages` under the `@rack-a-tiers` scope rather than to
> public npm. See `ai-context/notification-nodemailer-fork-publish-guide.md` in
> [`racky-store-medusa`](https://github.com/rackatiers/racky-store-medusa) for the build, publish, and
> upstream-sync workflow.

## Installation

This package lives in the private `racky-store-packages` Artifact Registry repo. Your `.npmrc` must map
the `@rack-a-tiers` scope to that registry and carry a valid auth token
(`npx google-artifactregistry-auth .npmrc`):

```bash
pnpm add @rack-a-tiers/notification-nodemailer nodemailer
```

`nodemailer` is a peer dependency — install it alongside.

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
          from: process.env.NOTIFICATION_PROVIDER_FROM,
          channels: ["email"],
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

## Development

This package builds with **Yarn 4** (pinned via `packageManager`) and Medusa's plugin builder:

```bash
corepack enable
yarn install --immutable
yarn build        # medusa plugin:build → .medusa/server/
yarn test         # vitest
```

Publish to Artifact Registry with **npm** (not yarn):

```bash
npx google-artifactregistry-auth .npmrc
npm publish
```

## Syncing with upstream

```bash
git fetch upstream
git checkout develop
git merge upstream/develop   # keep our package name + publishConfig on conflict
```

## License

MIT — see [LICENSE.md](./LICENSE.md). Originally authored by the Perseides team; forked and maintained
internally by Rack-a-Tiers.
