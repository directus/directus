<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Constraints;

use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Exception\MissingOptionsException;

/**
 * @Annotation
 * @Target({"PROPERTY", "METHOD", "ANNOTATION"})
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class Count extends Constraint
{
    const TOO_FEW_ERROR = 'bef8e338-6ae5-4caf-b8e2-50e7b0579e69';
    const TOO_MANY_ERROR = '756b1212-697c-468d-a9ad-50dd783bb169';

    protected static $errorNames = [
        self::TOO_FEW_ERROR => 'TOO_FEW_ERROR',
        self::TOO_MANY_ERROR => 'TOO_MANY_ERROR',
    ];

    public $minMessage = 'This collection should contain {{ limit }} element or more.|This collection should contain {{ limit }} elements or more.';
    public $maxMessage = 'This collection should contain {{ limit }} element or less.|This collection should contain {{ limit }} elements or less.';
    public $exactMessage = 'This collection should contain exactly {{ limit }} element.|This collection should contain exactly {{ limit }} elements.';
    public $min;
    public $max;

    public function __construct($options = null)
    {
        if (null !== $options && !\is_array($options)) {
            $options = [
                'min' => $options,
                'max' => $options,
            ];
        } elseif (\is_array($options) && isset($options['value']) && !isset($options['min']) && !isset($options['max'])) {
            $options['min'] = $options['max'] = $options['value'];
            unset($options['value']);
        }

        parent::__construct($options);

        if (null === $this->min && null === $this->max) {
            throw new MissingOptionsException(sprintf('Either option "min" or "max" must be given for constraint %s', __CLASS__), ['min', 'max']);
        }
    }
}
