<?php

use Twig\Node\Expression\Binary\EndsWithBinary;

class_exists('Twig\Node\Expression\Binary\EndsWithBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_EndsWith" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\EndsWithBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\EndsWithBinary" instead */
    class Twig_Node_Expression_Binary_EndsWith extends EndsWithBinary
    {
    }
}
