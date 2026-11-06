import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFile, readdir } from "node:fs/promises";
const db = new PGlite({ extensions: { pgcrypto } });
try {
  // Reproduce Supabase's database roles and verified JWT identity for RLS tests.
  // This does not simulate GoTrue, SMTP delivery, or the realtime transport.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create schema extensions;
    create extension pgcrypto with schema extensions;
    create publication supabase_realtime;
  `);
  for (const name of (
    await readdir(new URL("../supabase/migrations/", import.meta.url))
  ).sort()) {
    if (name.endsWith(".sql"))
      await db.exec(
        await readFile(
          new URL("../supabase/migrations/" + name, import.meta.url),
          "utf8",
        ),
      );
  }
  for (const name of (await readdir(new URL("../supabase/tests/", import.meta.url))).sort()) {
    if (!name.endsWith(".sql")) continue;
    const result = await db.exec(await readFile(new URL("../supabase/tests/" + name, import.meta.url), "utf8"));
    console.log(result.at(-1).rows[0].result);
  }
} catch (error) {
  console.error(error.message);
  if (error.where) console.error(error.where);
  process.exitCode = 1;
} finally {
  await db.close();
}
