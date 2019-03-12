<?php

use Twig\Node\NodeCaptureInterface;

class_exists('Twig\Node\NodeCaptureInterface');

@trigger_error(sprintf('Using the "Twig_NodeCaptureInterface" class is deprecated since Twig version 2.7, use "Twig\Node\NodeCaptureInterface" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\NodeCaptureInterface" instead */
    class Twig_NodeCaptureInterface extends NodeCaptureInterface
    {
    }
}
