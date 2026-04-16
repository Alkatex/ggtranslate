{
  "targets": [
    {
      "target_name": "virtual_audio_device",
      "sources": ["virtual_mic.cpp"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "libraries": [
        "-lole32",
        "-loleaut32",
        "-lksuser"
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1
        }
      }
    }
  ]
}