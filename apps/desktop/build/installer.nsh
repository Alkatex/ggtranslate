!macro customInstall
  DetailPrint "Installation de GGTranslate Mic..."
  
  SetOutPath "$TEMP\vbcable"
  File /r "${BUILD_RESOURCES_DIR}\vbcable\*.*"
  
  ExecWait '"$TEMP\vbcable\VBCABLE_Setup_x64.exe" /S' $0
  
  Sleep 3000
  
  SetOutPath "$TEMP\ggtranslate"
  File "${BUILD_RESOURCES_DIR}\rename-mic.ps1"
  nsExec::ExecToLog 'powershell -ExecutionPolicy Bypass -File "$TEMP\ggtranslate\rename-mic.ps1"'
  
  RMDir /r "$TEMP\vbcable"
  RMDir /r "$TEMP\ggtranslate"
  
  DetailPrint "GGTranslate Mic installé !"
!macroend

!macro customUnInstall
  DetailPrint "Désinstallation de GGTranslate Mic..."
  ExecWait '"$INSTDIR\resources\vbcable\VBCABLE_Setup_x64.exe" /S /U' $0
  DetailPrint "GGTranslate Mic désinstallé."
!macroend