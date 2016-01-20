<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib;

interface MessageInterface
{
    /**
     * Set metadata
     *
     * @param  string|int|array|\Traversable $spec
     * @param  mixed $value
     */
    public function setMetadata($spec, $value = null);

    /**
     * Get metadata
     *
     * @param  null|string|int $key
     * @return mixed
     */
    public function getMetadata($key = null);

    /**
     * Set content
     *
     * @param  mixed $content
     * @return mixed
     */
    public function setContent($content);

    /**
     * Get content
     *
     * @return mixed
     */
    public function getContent();

}
