# Luke development

Existing calendars and recipient progress must survive website deployments.

- Keep calendar IDs, account ownership, invitation tokens, quiz question keys and progress keys stable across releases.
- Preserve the IndexedDB database `luke-advent`, its `workspace` store and existing account/local-storage keys. UI updates must not reset or reseed saved data.
- Keep version 1 calendar documents and older optional fields readable. Changes to stored data need a backward-compatible migration rather than replacement with an empty workspace.
- Never run production data resets or database tests against the live Supabase project. Database tests use isolated PGlite databases.
- Keep `tests/fixtures/existing-workspace-v1.json` as a frozen example of saved user data. Update-compatibility tests must continue to preserve its calendar contents, IDs, opened doors and quiz results.
- Run the relevant tests and production build for UI changes. Changes to persistence, permissions or migrations also require the isolated database tests.
