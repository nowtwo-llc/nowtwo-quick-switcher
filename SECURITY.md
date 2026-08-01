# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 4.x | Yes |
| < 4.0 | No |

## Reporting a vulnerability

Please report security issues privately rather than in a public issue.

Use [GitHub's private vulnerability reporting](https://github.com/nowtwo-llc/nowtwo-quick-switcher/security/advisories/new)
for this repository, or email **support@nowtwo.io**.

Please include a description of the issue, steps to reproduce, and the affected
version. We aim to acknowledge reports within a few business days.

## Notes for consumers

Quick Switcher renders data your application supplies. Two properties differ in
how they are treated:

- **`text` and `description` are rendered as plain text** and are safe for
  untrusted data.
- **`html` is rendered as markup and is not sanitized.** Never build an `html`
  value from user-supplied input without sanitizing it yourself.

Versions before 4.0.0 rendered `text` through `innerHTML`, so untrusted values
in `text` could inject markup. If you are on 3.x or earlier and pass
user-supplied data to `text`, upgrade to 4.x.
