$ErrorActionPreference = "Stop"

$hostname = "smart-it.local"
$friendlyName = "IT Asset Management Local HTTPS ($hostname)"
$certificateDirectory = Join-Path $env:LOCALAPPDATA "it-asset-management\certificates"
$certificatePath = Join-Path $certificateDirectory "$hostname.crt"
$privateKeyPath = Join-Path $certificateDirectory "$hostname.key"
$currentUserStore = [System.Security.Cryptography.X509Certificates.StoreLocation]::CurrentUser
$personalStore = [System.Security.Cryptography.X509Certificates.X509Store]::new("My", $currentUserStore)
$trustedRootStore = [System.Security.Cryptography.X509Certificates.X509Store]::new("Root", $currentUserStore)

New-Item -ItemType Directory -Path $certificateDirectory -Force | Out-Null

$currentUserSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
$directoryAcl = Get-Acl -LiteralPath $certificateDirectory
$hasRestrictedAcl = $directoryAcl.AreAccessRulesProtected -and @(
    $directoryAcl.Access | Where-Object {
        -not $_.IsInherited -and
        $_.IdentityReference -eq $currentUserSid -and
        $_.AccessControlType -eq [System.Security.AccessControl.AccessControlType]::Allow -and
        $_.FileSystemRights -band [System.Security.AccessControl.FileSystemRights]::FullControl
    }
).Count -eq 1 -and @($directoryAcl.Access).Count -eq 1

if (-not $hasRestrictedAcl) {
    & icacls.exe $certificateDirectory /inheritance:r /grant:r "*$($currentUserSid.Value):(OI)(CI)F" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Could not restrict permissions on the local certificate directory."
    }
}

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
        -Subject "CN=$hostname" `
        -TextExtension @("2.5.29.17={text}DNS=$hostname&DNS=localhost&IPAddress=127.0.0.1") `
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
Write-Output "Add 127.0.0.1 $hostname to the Windows hosts file if it is not already present."
Write-Output "Start the frontend with npm run dev, then open https://$hostname`:5174/."
