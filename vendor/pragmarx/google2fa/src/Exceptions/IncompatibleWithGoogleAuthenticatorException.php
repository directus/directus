<?php

namespace PragmaRX\Google2FA\Exceptions;

use Exception;

class IncompatibleWithGoogleAuthenticatorException extends Exception
{
    protected $message = 'This secret key is not compatible with Google Authenticator.';
}
