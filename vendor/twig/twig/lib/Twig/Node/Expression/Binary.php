<?php

use Twig\Node\Expression\Binary\AbstractBinary;

class_exists('Twig\Node\Expression\Binary\AbstractBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\AbstractBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\AbstractBinary" instead */
    class Twig_Node_Expression_Binary extends AbstractBinary
    {
    }
}
