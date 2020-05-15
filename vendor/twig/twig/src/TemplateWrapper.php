<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig;

/**
 * Exposes a template to userland.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
final class TemplateWrapper
{
    private $env;
    private $template;

    /**
     * This method is for internal use only and should never be called
     * directly (use Twig\Environment::load() instead).
     *
     * @internal
     */
    public function __construct(Environment $env, Template $template)
    {
        $this->env = $env;
        $this->template = $template;
    }

    public function render(array $context = []): string
    {
        // using func_get_args() allows to not expose the blocks argument
        // as it should only be used by internal code
        return $this->template->render($context, \func_get_args()[1] ?? []);
    }

    public function display(array $context = [])
    {
        // using func_get_args() allows to not expose the blocks argument
        // as it should only be used by internal code
        $this->template->display($context, \func_get_args()[1] ?? []);
    }

    public function hasBlock(string $name, array $context = []): bool
    {
        return $this->template->hasBlock($name, $context);
    }

    /**
     * @return string[] An array of defined template block names
     */
    public function getBlockNames(array $context = []): array
    {
        return $this->template->getBlockNames($context);
    }

    public function renderBlock(string $name, array $context = []): string
    {
        $context = $this->env->mergeGlobals($context);
        $level = ob_get_level();
        if ($this->env->isDebug()) {
            ob_start();
        } else {
            ob_start(function () { return ''; });
        }
        try {
            $this->template->displayBlock($name, $context);
        } catch (\Throwable $e) {
            while (ob_get_level() > $level) {
                ob_end_clean();
            }

            throw $e;
        }

        return ob_get_clean();
    }

    public function displayBlock(string $name, array $context = [])
    {
        $this->template->displayBlock($name, $this->env->mergeGlobals($context));
    }

    public function getSourceContext(): Source
    {
        return $this->template->getSourceContext();
    }

    public function getTemplateName(): string
    {
        return $this->template->getTemplateName();
    }

    /**
     * @internal
     *
     * @return Template
     */
    public function unwrap()
    {
        return $this->template;
    }
}
