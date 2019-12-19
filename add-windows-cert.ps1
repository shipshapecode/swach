$base64string = $Env:CERTIFICATE_WINDOWS_PFX
$FileName = 'certificate.pfx'

[IO.File]::WriteAllBytes($FileName, [Convert]::FromBase64String($base64string))