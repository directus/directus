<?php

namespace PragmaRX\Google2FA\Exceptions;

use Exception;

class SecretKeyTooShortException extends Exception
{
    protected $message = 'Secret key is too short. Must be at least 16 base32 characters';
}
