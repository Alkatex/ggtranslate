$regPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\MMDevices\Audio\Capture"
Get-ChildItem $regPath | ForEach-Object {
    try {
        $propsPath = "$($_.PSPath)\Properties"
        $friendlyName = (Get-ItemProperty $propsPath -ErrorAction SilentlyContinue)."{a45c254e-df1c-4efd-8020-67d146a850e0},2"
        if ($friendlyName -like "*CABLE Output*") {
            Set-ItemProperty $propsPath "{a45c254e-df1c-4efd-8020-67d146a850e0},2" "GGTranslate Mic"
            Write-Host "GGTranslate Mic configuré"
        }
    } catch {}
}