# Security Policy

## Supported versions

TrainLoop is under active development. Security fixes are applied to the latest
code on `main`. Older commits and feature branches do not receive security fixes;
update to the latest `main` when running your own deployment.

## Dependency security

Dependabot alerts and security updates are enabled for this repository. When
GitHub detects a known dependency vulnerability, Dependabot automatically opens
a pull request if a patched version is available and it can resolve the update.
Otherwise, the alert remains open for manual action. Security update pull requests
do not wait for the weekly version-update schedule; maintainers still need to
review and merge them.

The [Dependabot configuration](.github/dependabot.yml) also checks npm dependencies
across the pnpm workspace and GitHub Actions for version updates every Sunday at
01:00 (Europe/Prague). npm minor and patch updates are grouped together, and GitHub
Actions updates have their own group. Prisma 8 updates (`prisma` and `@prisma/*`)
are currently ignored; Prisma 7 updates remain enabled.

These checks cover known dependency vulnerabilities and available updates. Please
report suspected application vulnerabilities through the private channel below.

## Reporting a vulnerability

Please report suspected vulnerabilities privately through
[GitHub's vulnerability reporting form](https://github.com/applifting-vsecourse/team-7/security/advisories/new).
Reports in Czech or English are welcome.

If private reporting is unavailable, open an issue asking for a private security
contact, without describing the vulnerability or including sensitive information.
The [maintainers listed in the README](README.md#team) can arrange a private channel.
Wait for that channel before sharing details.

Do not disclose vulnerability details in public issues, pull requests, discussions,
or logs before coordinating with the maintainers.

### What to include

- A description of the vulnerability and its potential impact.
- The affected component, endpoint, and commit or deployed version, if known.
- Steps to reproduce, including any required account roles or configuration.
- A minimal proof of concept or redacted screenshots and logs, if helpful.
- Any suggested mitigation or fix.

Remove passwords, session cookies, tokens, credentials, and other users' personal
data from your report. Use test accounts and synthetic data wherever possible.

## Responsible testing

Prefer a local deployment and accounts you control. Do not access or modify other
users' data, disrupt the hosted service, perform denial-of-service testing, or use
social engineering. If you encounter sensitive data, stop testing and report the
issue privately without collecting more data.

## Handling reports

Maintainers review reports, request additional information when needed, and
coordinate fixes and disclosure with the reporter. This is a student project;
response and resolution times depend on maintainer availability and are not
guaranteed. Please allow time for a fix before publishing details, and agree on
disclosure timing with the maintainers.
