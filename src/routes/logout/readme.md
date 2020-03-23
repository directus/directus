# Logout View

Renders an empty page with a spinner, and logs the user out. Once the user is logged out, it will redirect to login.

## Why a separate route?

If we were to logout on any other route that uses the private view, it would mean that there will be a bunch of errors in the devtools, as a lot of things will be trying to read from the store, which will be cleared. This extra route makes sure we can safely empty the store without any component still reading from it.
