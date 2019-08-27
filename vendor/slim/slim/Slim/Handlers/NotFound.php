<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @license https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */

namespace Slim\Handlers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Http\Body;
use UnexpectedValueException;

class NotFound extends AbstractHandler
{
    /**
     * @param  ServerRequestInterface $request  The most recent Request object
     * @param  ResponseInterface      $response The most recent Response object
     *
     * @return ResponseInterface
     *
     * @throws UnexpectedValueException
     */
    public function __invoke(ServerRequestInterface $request, ResponseInterface $response)
    {
        if ($request->getMethod() === 'OPTIONS') {
            $contentType = 'text/plain';
            $output = $this->renderPlainNotFoundOutput();
        } else {
            $contentType = $this->determineContentType($request);
            switch ($contentType) {
                case 'application/json':
                    $output = $this->renderJsonNotFoundOutput();
                    break;

                case 'text/xml':
                case 'application/xml':
                    $output = $this->renderXmlNotFoundOutput();
                    break;

                case 'text/html':
                    $output = $this->renderHtmlNotFoundOutput($request);
                    break;

                default:
                    throw new UnexpectedValueException('Cannot render unknown content type ' . $contentType);
            }
        }

        $body = new Body(fopen('php://temp', 'r+'));
        $body->write($output);

        return $response->withStatus(404)
                        ->withHeader('Content-Type', $contentType)
                        ->withBody($body);
    }

    /**
     * Render plain not found message
     *
     * @return string
     */
    protected function renderPlainNotFoundOutput()
    {
        return 'Not found';
    }

    /**
     * Return a response for application/json content not found
     *
     * @return string
     */
    protected function renderJsonNotFoundOutput()
    {
        return '{"message":"Not found"}';
    }

    /**
     * Return a response for xml content not found
     *
     * @return string
     */
    protected function renderXmlNotFoundOutput()
    {
        return '<root><message>Not found</message></root>';
    }

    /**
     * Return a response for text/html content not found
     *
     * @param  ServerRequestInterface $request The most recent Request object
     *
     * @return string
     */
    protected function renderHtmlNotFoundOutput(ServerRequestInterface $request)
    {
        $homeUrl = (string)($request->getUri()->withPath('')->withQuery('')->withFragment(''));
        return <<<END
<html>
    <head>
        <title>Page Not Found</title>
        <style>
            body{
                margin:0;
                padding:30px;
                font:12px/1.5 Helvetica,Arial,Verdana,sans-serif;
            }
            h1{
                margin:0;
                font-size:48px;
                font-weight:normal;
                line-height:48px;
            }
            strong{
                display:inline-block;
                width:65px;
            }
        </style>
    </head>
    <body>
        <h1>Page Not Found</h1>
        <p>
            The page you are looking for could not be found. Check the address bar
            to ensure your URL is spelled correctly. If all else fails, you can
            visit our home page at the link below.
        </p>
        <a href='$homeUrl'>Visit the Home Page</a>
    </body>
</html>
END;
    }
}
