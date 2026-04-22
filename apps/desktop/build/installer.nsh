!macro customInstall
  ; Installer VB-Audio Virtual Cable silencieusement
  DetailPrint "Installation de GGTranslate Mic..."
  
  ; Copier les fichiers VB-Audio dans un dossier temp
  SetOutPath "$TEMP\vbcable"
  File /r "${BUILD_RESOURCES_DIR}\vbcable\*.*"
  
  ; Installer le driver silencieusement
  ExecWait '"$TEMP\vbcable\VBCABLE_Setup_x64.exe" /S' $0
  
  ; Renommer le device "GGTranslate Mic" via registre
  WriteRegStr HKLM "SYSTEM\CurrentControlSet\Control\MediaCategories\{B3F2B2E0-AB3B-4B5C-A9FF-3B1B0A6B1B8A}" "Name" "GGTranslate Mic"
  
  ; Nettoyer
  RMDir /r "$TEMP\vbcable"
  
  DetailPrint "GGTranslate Mic installé avec succès !"
!macroend

!macro customUnInstall
  ; Désinstaller VB-Audio à la désinstallation de GGTranslate
  DetailPrint "Désinstallation de GGTranslate Mic..."
  ExecWait '"$INSTDIR\resources\vbcable\VBCABLE_Setup_x64.exe" /S /U' $0
  DetailPrint "GGTranslate Mic désinstallé."
!macroend