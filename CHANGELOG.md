# @rack-a-tiers/notification-nodemailer

> Internal Rack-a-Tiers fork of [`@perseidesjs/notification-nodemailer`](https://github.com/perseidesjs/notification-nodemailer).
> Versions below `3.2.0` are inherited from upstream; entries from `3.2.0` onward track this fork,
> based on upstream `@perseidesjs/notification-nodemailer@3.2.0`.

## 3.2.0 (fork base)

### Fork changes

- Rebrand package to `@rack-a-tiers/notification-nodemailer`; publish to the private GCP Artifact
  Registry repo `racky-store-packages` (via `publishConfig.registry`) instead of public npm.
- Disable the upstream changesets auto-publish workflow; publish manually with `npm publish`.

---

## Upstream history (`@perseidesjs/notification-nodemailer`)

### 3.2.0 — Minor Changes

- 88228a9: Add replyTo, cc, and bcc support via provider_data

## 3.1.1

### Patch Changes

- 150f64e: fix: properly handle base64-encoded attachment content for inline images

  - Add `isBase64String` detection to identify base64-encoded content
  - Set `encoding: 'base64'` for nodemailer when content is base64 to prevent double-encoding
  - Fixes inline CID images not displaying in email clients

## 3.1.0

### Minor Changes

- 19038de: Upgrade to Medusa 2.13.0

## 3.0.0

### Major Changes

- 0d2d355: v3

## 2.0.0

### Major Changes

- 29c0c9c: ### Breaking Change
  - Upgrade to medusa 2.10.3

## 1.1.0

### Minor Changes

- 1669799: Updated README.md
