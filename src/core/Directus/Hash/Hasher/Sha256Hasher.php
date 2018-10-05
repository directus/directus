<?php

namespace Directus\Hash\Hasher;

class Sha256Hasher extends AbstractHashHasher
{
    /**
     * @inheritdoc
     */
    public function getName()
    {
        return 'sha256';
    }
}
