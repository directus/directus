<?php

namespace Directus\Hash\Hasher;

class Sha224Hasher extends AbstractHashHasher
{
    /**
     * @inheritdoc
     */
    public function getName()
    {
        return 'sha224';
    }
}
