<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib\Hydrator\Strategy;

class ClosureStrategy implements StrategyInterface
{
    /**
     * Function, used in extract method, default:
     * function ($value) {
     *     return $value;
     * };
     * @var callable
     */
    protected $extractFunc = null;

    /**
     * Function, used in hydrate method, default:
     * function ($value) {
     *     return $value;
     * };
     * @var callable
     */
    protected $hydrateFunc = null;

    /**
     * You can describe how your values will extract and hydrate, like this:
     * $hydrator->addStrategy('category', new ClosureStrategy(
     *     function (Category $value) {
     *         return (int) $value->id;
     *     },
     *     function ($value) {
     *         return new Category((int) $value);
     *     }
     * ));
     *
     * @param callable $extractFunc - anonymous function, that extract values
     * from object
     * @param callable $hydrateFunc - anonymous function, that hydrate values
     * into object
     */
    public function __construct($extractFunc = null, $hydrateFunc = null)
    {
        if (isset($extractFunc)) {
            if (!is_callable($extractFunc)) {
                throw new \Exception('$extractFunc must be callable');
            }

            $this->extractFunc = $extractFunc;
        } else {
            $this->extractFunc = function ($value) {
                return $value;
            };
        }

        if (isset($hydrateFunc)) {
            if (!is_callable($hydrateFunc)) {
                throw new \Exception('$hydrateFunc must be callable');
            }

            $this->hydrateFunc = $hydrateFunc;
        } else {
            $this->hydrateFunc = function ($value) {
                return $value;
            };
        }
    }

    /**
     * Converts the given value so that it can be extracted by the hydrator.
     *
     * @param mixed $value The original value.
     * @return mixed Returns the value that should be extracted.
     */
    public function extract($value)
    {
        $func = $this->extractFunc;

        return $func($value);
    }

    /**
     * Converts the given value so that it can be hydrated by the hydrator.
     *
     * @param mixed $value The original value.
     * @return mixed Returns the value that should be hydrated.
     */
    public function hydrate($value)
    {
        $func = $this->hydrateFunc;

        return $func($value);
    }
}
