$base64string = $Env:CERTIFICATE_WINDOWS_PFX
$FileName = 'win-certificate.pfx'
$Pfxpath = './win-certificate.pfx'

[IO.File]::WriteAllBytes($FileName, [Convert]::FromBase64String($base64string))

$Password = ConvertTo-SecureString -String $Env:WINDOWS_PFX_PASSWORD -AsPlainText -Force
Import-PfxCertificate -FilePath $Pfxpath -CertStoreLocation Cert:\CurrentUser\My -Password $Password
