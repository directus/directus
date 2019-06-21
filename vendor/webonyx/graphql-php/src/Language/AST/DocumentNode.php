<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class DocumentNode extends Node
{
    /** @var string */
    public $kind = NodeKind::DOCUMENT;

    /** @var NodeList|DefinitionNode[] */
    public $definitions;
}
