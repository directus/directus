<?php

$config = PhpCsFixer\Config::create()
    ->setRiskyAllowed(true)
    ->setRules([
        '@PSR2' => true,
        'array_syntax' => ['syntax' => 'short'],
        'declare_strict_types' => false,
        'concat_space' => ['spacing'=>'one'],
        // 'ordered_imports' => true,
        // 'phpdoc_align' => ['align'=>'vertical'],
        // 'native_function_invocation' => true,
    ])
    ->setFinder(
        PhpCsFixer\Finder::create()
            ->in(__DIR__.'/src')
            ->name('*.php')
    )
;

return $config;
