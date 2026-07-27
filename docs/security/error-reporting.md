# Privacy-safe frontend error reporting

The reporter accepts only release, pathname, a coarse error class, runtime and an optional
backend request ID. Axios failures and the React error boundary use this abstraction.
Passwords, tokens, cookies, headers, form values, URLs with query strings, message bodies,
child/health/incident content and raw exception messages are outside the report schema.

No external monitoring provider is configured. Production therefore uses the no-op provider
until an operator explicitly supplies a reviewed adapter; tests inject an in-memory adapter
and verify the allowlist.
