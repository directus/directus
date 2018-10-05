<?php

namespace Directus\Hash\Hasher;

class MD5Hasher extends AbstractHashHasher
{
    /**
     * @inheritdoc
     */
    public function getName()
    {
        return 'md5';
    }
}
