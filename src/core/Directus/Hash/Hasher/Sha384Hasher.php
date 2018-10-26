<?php

namespace Directus\Hash\Hasher;

class Sha384Hasher extends AbstractHashHasher
{
    /**
     * @inheritdoc
     */
    public function getName()
    {
        return 'sha384';
    }
}
