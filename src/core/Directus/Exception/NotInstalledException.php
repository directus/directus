<?php

namespace Directus\Exception;

class NotInstalledException extends Exception implements ServiceUnavailableInterface
{
    const ERROR_CODE = 14;
}
