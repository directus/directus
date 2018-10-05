<?php

namespace Directus\Database\Ddl\Column;

class Enum extends CollectionLength
{
    /**
     * @var string
     */
    protected $type = 'ENUM';
}
