<?php

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');
$publicPath = dirname(__DIR__).'/public';

// Product images live under public/products, which is also an application
// route. Let the built-in server handle real files and send directories and
// virtual routes through Laravel's front controller.
if ($uri !== '/' && is_file($publicPath.$uri)) {
    return false;
}

require $publicPath.'/index.php';
