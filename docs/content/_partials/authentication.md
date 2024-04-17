While the Public role can be configured to make data available without authentication, anything that is not public requires a user to authenticate their requests.

Each user can have a single Static Tokens that does not expire (though can be regenerated). Temporary and Session Tokens are returned after a user logs in, are short lived, and need refreshing.

Requests can be authenticated in the following ways:

::tabs
	::tab{label="Authorization Header"}
	Add the following header: `Authorization: Bearer <token>`
	::

	::tab{label="Session Cookies"}
	Set the following cookie: `directus_session_token=<token>`
	::

	::tab{label="Query Parameter"}
	Append the following query parameter: `?access_token=<token>`
	::
::
