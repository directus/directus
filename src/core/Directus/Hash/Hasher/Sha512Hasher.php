<?php

namespace Directus\Hash\Hasher;

class Sha512Hasher extends AbstractHashHasher
{
    /**
     * @inheritdoc
     */
    public function getName()
    {
        return 'sha512';
    }
}
