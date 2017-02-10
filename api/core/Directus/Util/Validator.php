<?php

namespace Directus\Util;

class Validator
{
    /**
     * @param $email
     *
     * @return bool
     */
    public static function email($email)
    {
        return preg_match('/^.+\@\S+\.\S+$/', $email);
    }
}
