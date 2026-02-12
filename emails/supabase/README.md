# Supabase Auth Emails (PLNR)

Use these in Supabase Dashboard -> Authentication -> Email Templates.

## Files

- `magic-link-subject.txt`
- `magic-link.html`
- `magic-link.txt`

## Important

- These use **Supabase Go template variables** (for example `{{ .ConfirmationURL }}`).
- Do not replace those manually in code when using Supabase auth emails.

## Free plan note

Supabase built-in email sender is for testing and heavily limited.
For real users, configure custom SMTP (Resend is fine) in Auth settings.
