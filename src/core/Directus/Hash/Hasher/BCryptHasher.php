<?php

namespace Directus\Hash\Hasher;

class BCryptHasher implements HasherInterface
{
    /**
     * @inheritdoc
     */
    public function getName()
    {
        return 'bcrypt';
    }

    /**
     * @inheritdoc
     */
    public function hash($string, array $options = [])
    {
        return password_hash($string, PASSWORD_BCRYPT, $options);
    }

    /**
     * @inheritdoc
     */
    public function verify($string, $hash, array $options = [])
    {
        return password_verify($string, $hash);
    }
}
