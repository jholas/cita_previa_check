<?php

function printError($msg) {
    echo '{ "error": \"'.$msg.'\" }';
    return;
}


if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    printError("invalid method");
    return;
}

if ($_SERVER['CONTENT_TYPE'] != 'application/json') {
    printError("invalid content type");
    return;
}

//phpinfo();


$data = json_decode(file_get_contents('php://input'), true);
$lastJsonError = json_last_error();
if ($lastJsonError != JSON_ERROR_NONE) {
    printError('decoding json request failed: '.$lastJsonError);
    return;
}

if ($data['token'] == null) {
    printError('request failed');
    return;
}

$pwd = "USE_HERE_RANDOM_PASSWORD__USE_HASH_IN_MAILER_CONFIG";
$hashed = hash("sha512", $pwd);
if ($hashed != $data['token']) {
    printError('request failed');
    return;
}


function writeHtmlLine($key, $value) {
    echo '<b>'.$key.'</b>: '.$value.'<br>';
}


writeHtmlLine('to', $data['to']);
writeHtmlLine('from', $data['from']);
writeHtmlLine('subject', $data['subject']);
writeHtmlLine('text', $data['text']);
writeHtmlLine('html', $data['html']);

/*
ob_start();
?>
//follows text to compose email
<?php
$mail = ob_get_clean();
*/


mail(
    $data['to'],
    $data['subject'],
    $data['html'],
    'From: '.$data['from']."\r\n".
    'Content-type: text/html; charset=utf-8'."\r\n"
);

?>
