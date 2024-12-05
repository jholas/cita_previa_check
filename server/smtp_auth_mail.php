<?php

//ini_set('display_errors', '1');
//ini_set('display_startup_errors', '1');
//error_reporting(E_ALL);

require './phpmailer/Exception.php';
require './phpmailer/PHPMailer.php';
require './phpmailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;


function mail2($to, $subject, $htmlBody, $from) {
	
	$to_arr = explode(',', $to);
	
	$from_arr = explode('|', $from);
	$from_email = $from_arr[1];
	$from_name = $from_arr[0];
	
	
	//Create an instance; passing `true` enables exceptions
	$mail = new PHPMailer(true);

	try {
		//Server settings
		//$mail->SMTPDebug = SMTP::DEBUG_SERVER;                      //Enable verbose debug output
		$mail->isSMTP();                                            //Send using SMTP
		$mail->Host       = 'smtp.server.com';                     //Set the SMTP server to send through
		$mail->SMTPAuth   = true;                                   //Enable SMTP authentication
		$mail->Username   = 'username@mail.com';                     //SMTP username
		$mail->Password   = 'password';                               //SMTP password
		$mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;            //Enable implicit TLS encryption
		$mail->Port       = 465;                                    //TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`

		$mail->CharSet = 'UTF-8';

		//Recipients
		//$mail->setFrom('from@mail.com', 'User From');
		$mail->setFrom(trim($from_email), trim($from_name));
		
		//$mail->addAddress('mail@example.com', 'Joe User');     //Add a recipient
		//$mail->addAddress('mail@example.com');               //Name is optional
		foreach ($to_arr as &$val) {
			//print_r('|'.trim($val).'|');
			$mail->addAddress(trim($val));
		}
		
		//$mail->addReplyTo('info@example.com', 'Information');
		//$mail->addCC('cc@example.com');
		//$mail->addBCC('bcc@example.com');

		//Attachments
		//$mail->addAttachment('/var/tmp/file.tar.gz');         //Add attachments
		//$mail->addAttachment('/tmp/image.jpg', 'new.jpg');    //Optional name

		//Content
		$mail->isHTML(true);                                  //Set email format to HTML
		$mail->Subject = $subject;
		$mail->Body    = $htmlBody;
		//$mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

		$mail->send();
		//echo 'Message has been sent';
	} catch (Exception $e) {
		//echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
	}
}
