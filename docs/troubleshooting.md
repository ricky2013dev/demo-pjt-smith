# Troubleshooting

Symptoms you are likely to hit while running the demo, and what to check.

[← Back to the README](../README.md)

---

**Missing or empty data.** The startup log prints how many rows were loaded
(`Mockup database ready: N rows across 20 tables.`). If a table is empty, check
that its JSON file in `mockupdata/db/` exists and contains a valid array of rows.

**Data resets on restart.** Expected — the mockup database lives in memory. Set
`MOCK_DB_PERSIST=true` in `.env.local` to flush changes back to the JSON files.

**Port already in use.** Change `PORT` in `.env.local`.

**Decryption fails with "Failed to decrypt data".** Confirm `ENCRYPTION_KEY` is
set, that the ciphertext was produced with the same key, and that the stored
value is properly base64 encoded.

**A mask appears instead of the decrypted value.** Check that the field's
`isEncrypted` flag is true, that the user is authenticated and has access to the
patient, and look for API errors in the browser console.

**Auto-hide doesn't fire.** Verify `autoHideDelay` (default `10000`), that the
component is mounted, and that no JavaScript error interrupted the timer.

**Insurance fields appear unencrypted.** Verify encryption was applied on
create/update, that the update path checks for masked values, and that older
rows were migrated to the encrypted format.
