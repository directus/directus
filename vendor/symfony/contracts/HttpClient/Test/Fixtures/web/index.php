<?php

if ('cli-server' !== \PHP_SAPI) {
    // safe guard against unwanted execution
    throw new \Exception("You cannot run this script directly, it's a fixture for TestHttpServer.");
}

$vars = [];

if (!$_POST) {
    $_POST = json_decode(file_get_contents('php://input'), true);
    $_POST['content-type'] = $_SERVER['HTTP_CONTENT_TYPE'] ?? '?';
}

foreach ($_SERVER as $k => $v) {
    switch ($k) {
        default:
            if (0 !== strpos($k, 'HTTP_')) {
                continue 2;
            }
            // no break
        case 'SERVER_NAME':
        case 'SERVER_PROTOCOL':
        case 'REQUEST_URI':
        case 'REQUEST_METHOD':
        case 'PHP_AUTH_USER':
        case 'PHP_AUTH_PW':
            $vars[$k] = $v;
    }
}

switch ($vars['REQUEST_URI']) {
    default:
        exit;

    case '/':
    case '/?a=a&b=b':
    case 'http://127.0.0.1:8057/':
    case 'http://localhost:8057/':
        header('Content-Type: application/json');
        ob_start('ob_gzhandler');
        break;

    case '/404':
        header('Content-Type: application/json', true, 404);
        break;

    case '/301':
        if ('Basic Zm9vOmJhcg==' === $vars['HTTP_AUTHORIZATION']) {
            header('Location: http://127.0.0.1:8057/302', true, 301);
        }
        break;

    case '/301/bad-tld':
        header('Location: http://foo.example.', true, 301);
        break;

    case '/302':
        if (!isset($vars['HTTP_AUTHORIZATION'])) {
            header('Location: http://localhost:8057/', true, 302);
        }
        break;

    case '/302/relative':
        header('Location: ..', true, 302);
        break;

    case '/307':
        header('Location: http://localhost:8057/post', true, 307);
        break;

    case '/length-broken':
        header('Content-Length: 1000');
        break;

    case '/post':
        $output = json_encode($_POST + ['REQUEST_METHOD' => $vars['REQUEST_METHOD']], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        header('Content-Type: application/json', true);
        header('Content-Length: '.\strlen($output));
        echo $output;
        exit;

    case '/timeout-header':
        usleep(300000);
        break;

    case '/timeout-body':
        echo '<1>';
        @ob_flush();
        flush();
        usleep(500000);
        echo '<2>';
        exit;

    case '/timeout-long':
        ignore_user_abort(false);
        sleep(1);
        while (true) {
            echo '<1>';
            @ob_flush();
            flush();
            usleep(500);
        }
        exit;

    case '/chunked':
        header('Transfer-Encoding: chunked');
        echo "8\r\nSymfony \r\n5\r\nis aw\r\n6\r\nesome!\r\n0\r\n\r\n";
        exit;

    case '/chunked-broken':
        header('Transfer-Encoding: chunked');
        echo "8\r\nSymfony \r\n5\r\nis aw\r\n6\r\ne";
        exit;

    case '/gzip-broken':
        header('Content-Encoding: gzip');
        echo str_repeat('-', 1000);
        exit;
}

header('Content-Type: application/json', true);

echo json_encode($vars, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
