<?php

declare(strict_types=1);

namespace GraphQL\Validator\Rules;

use GraphQL\Error\Error;
use GraphQL\Language\AST\DirectiveNode;
use GraphQL\Language\AST\Node;
use GraphQL\Validator\ValidationContext;
use function sprintf;

class UniqueDirectivesPerLocation extends ValidationRule
{
    public function getVisitor(ValidationContext $context)
    {
        return [
            'enter' => static function (Node $node) use ($context) {
                if (! isset($node->directives)) {
                    return;
                }

                $knownDirectives = [];
                foreach ($node->directives as $directive) {
                    /** @var DirectiveNode $directive */
                    $directiveName = $directive->name->value;
                    if (isset($knownDirectives[$directiveName])) {
                        $context->reportError(new Error(
                            self::duplicateDirectiveMessage($directiveName),
                            [$knownDirectives[$directiveName], $directive]
                        ));
                    } else {
                        $knownDirectives[$directiveName] = $directive;
                    }
                }
            },
        ];
    }

    public static function duplicateDirectiveMessage($directiveName)
    {
        return sprintf('The directive "%s" can only be used once at this location.', $directiveName);
    }
}
