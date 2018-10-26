<?php

namespace Directus\Hash\Hasher;

class Sha1Hasher extends AbstractHashHasher
{
    /**
     * @inheritdoc
     */
    public function getName()
    {
        return 'sha1';
    }
}
