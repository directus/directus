<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2015 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib;

interface DispatchableInterface
{
    /**
     * Dispatch a request
     *
     * @param RequestInterface $request
     * @param null|ResponseInterface $response
     * @return Response|mixed
     */
    public function dispatch(RequestInterface $request, ResponseInterface $response = null);
}
