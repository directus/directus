<?php

namespace Directus\Hash\Hasher;

class CoreHasher implements HasherInterface
{
    /**
     * @inheritdoc
     */
    public function getName()
    {
        return 'core';
    }

    /**
     * @inheritdoc
     */
    public function hash($string, array $options = [])
    {
        return password_hash($string, PASSWORD_DEFAULT, $options);
    }

    public function verify($string, $hash, array $options = [])
    {
        return password_verify($string, $hash);
    }
}
