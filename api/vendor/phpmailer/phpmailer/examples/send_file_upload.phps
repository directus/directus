<?php
/**
 * PHPMailer simple file upload and send example
 */
$msg = '';
if (array_key_exists('userfile', $_FILES)) {
    // First handle the upload
    // Don't trust provided filename - same goes for MIME types
    // See http://php.net/manual/en/features.file-upload.php#114004 for more thorough upload validation
    $uploadfile = tempnam(sys_get_temp_dir(), sha1($_FILES['userfile']['name']));
    if (move_uploaded_file($_FILES['userfile']['tmp_name'], $uploadfile)) {
        // Upload handled successfully
        // Now create a message
        // This should be somewhere in your include_path
        require 'PHPMailerAutoload.php';
        $mail = new PHPMailer;
        $mail->setFrom('from@example.com', 'First Last');
        $mail->addAddress('whoto@example.com', 'John Doe');
        $mail->Subject = 'PHPMailer file sender';
        $mail->msgHTML("My message body");
        // Attach the uploaded file
        $mail->addAttachment($uploadfile, 'My uploaded file');
        if (!$mail->send()) {
            $msg = "Mailer Error: " . $mail->ErrorInfo;
        } else {
            $msg = "Message sent!";
        }
    } else {
        $msg = 'Failed to move file to ' . $uploadfile;
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>PHPMailer Upload</title>
</head>
<body>
<?php if (empty($msg)) { ?>
    <form method="post" enctype="multipart/form-data">
        <input type="hidden" name="MAX_FILE_SIZE" value="100000"> Send this file: <input name="userfile" type="file">
        <input type="submit" value="Send File">
    </form>
<?php } else {
    echo $msg;
} ?>
</body>
</html>