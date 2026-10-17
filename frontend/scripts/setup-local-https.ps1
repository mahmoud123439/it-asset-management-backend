$ErrorActionPreference = "Stop"

$friendlyName = "IT Asset Management Local HTTPS"
$certificateDirectory = Join-Path $env:LOCALAPPDATA "it-asset-management\certificates"
$certificatePath = Join-Path $certificateDirectory "127.0.0.1.crt"
$privateKeyPath = Join-Path $certificateDirectory "127.0.0.1.key"
$currentUserStore = [System.Security.Cryptography.X509Certificates.StoreLocation]::CurrentUser
$personalStore = [System.Security.Cryptography.X509Certificates.X509Store]::new("My", $currentUserStore)
$trustedRootStore = [System.Security.Cryptography.X509Certificates.X509Store]::new("Root", $currentUserStore)

New-Item -ItemType Directory -Path $certificateDirectory -Force | Out-Null

$directoryAcl = [System.Security.AccessControl.DirectorySecurity]::new()
$directoryAcl.SetAccessRuleProtection($true, $false)
$currentUserSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
$directoryAcl.SetOwner($currentUserSid)
$directoryRule = [System.Security.AccessControl.FileSystemAccessRule]::new(
    $currentUserSid,
    [System.Security.AccessControl.FileSystemRights]::FullControl,
    [System.Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [System.Security.AccessControl.InheritanceFlags]::ObjectInherit,
    [System.Security.AccessControl.PropagationFlags]::None,
    [System.Security.AccessControl.AccessControlType]::Allow
)
$directoryAcl.AddAccessRule($directoryRule)
Set-Acl -LiteralPath $certificateDirectory -AclObject $directoryAcl

$personalStore.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
$trustedRootStore.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
try {
    foreach ($store in @($personalStore, $trustedRootStore)) {
        $oldCertificates = @($store.Certificates | Where-Object { $_.FriendlyName -eq $friendlyName })
        foreach ($oldCertificate in $oldCertificates) {
            $store.Remove($oldCertificate)
        }
    }

    $certificate = New-SelfSignedCertificate `
        -Subject "CN=127.0.0.1" `
        -TextExtension @("2.5.29.17={text}DNS=localhost&IPAddress=127.0.0.1") `
        -Type SSLServerAuthentication `
        -KeyAlgorithm RSA `
        -KeyLength 2048 `
        -KeyExportPolicy Exportable `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -NotAfter (Get-Date).AddYears(2) `
        -FriendlyName $friendlyName

    $rsaKey = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($certificate)
    try {
        $keyBytes = $rsaKey.Key.Export([System.Security.Cryptography.CngKeyBlobFormat]::Pkcs8PrivateBlob)
        $keyBase64 = [Convert]::ToBase64String($keyBytes)
        $keyLines = [regex]::Matches($keyBase64, ".{1,64}") | ForEach-Object { $_.Value }
        [System.IO.File]::WriteAllText(
            $privateKeyPath,
            "-----BEGIN PRIVATE KEY-----`n$($keyLines -join "`n")`n-----END PRIVATE KEY-----`n",
            [System.Text.Encoding]::ASCII
        )
        [Array]::Clear($keyBytes, 0, $keyBytes.Length)
    }
    finally {
        $rsaKey.Dispose()
    }

    $certificateBase64 = [Convert]::ToBase64String($certificate.RawData)
    $certificateLines = [regex]::Matches($certificateBase64, ".{1,64}") | ForEach-Object { $_.Value }
    [System.IO.File]::WriteAllText(
        $certificatePath,
        "-----BEGIN CERTIFICATE-----`n$($certificateLines -join "`n")`n-----END CERTIFICATE-----`n",
        [System.Text.Encoding]::ASCII
    )
    $trustedRootStore.Add($certificate)
}
finally {
    $personalStore.Close()
    $trustedRootStore.Close()
}

Write-Output "Local HTTPS certificate created and trusted for the current Windows user."
Write-Output "Start the frontend with npm run dev, then open https://127.0.0.1:5174/."
