<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class SelectionSetNode extends Node
{
    /** @var string */
    public $kind = NodeKind::SELECTION_SET;

    /** @var SelectionNode[] */
    public $selections;
}
