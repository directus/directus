<?php

declare(strict_types=1);

namespace GraphQL\Type;

class TypeKind
{
    const SCALAR         = 0;
    const OBJECT         = 1;
    const INTERFACE_KIND = 2;
    const UNION          = 3;
    const ENUM           = 4;
    const INPUT_OBJECT   = 5;
    const LIST_KIND      = 6;
    const NON_NULL       = 7;
}
