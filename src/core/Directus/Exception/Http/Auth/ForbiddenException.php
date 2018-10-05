<?php

namespace Directus\Exception\Http\Auth;

class ForbiddenException extends \Directus\Permissions\Exception\ForbiddenException
{
    // status code = 401
}
