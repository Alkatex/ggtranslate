{
  "targets": [
    {
      "target_name": "loopback_capture",
      "sources": ["capture.cpp"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1
        }
      },
      "libraries": [
        "-lole32",
        "-loleaut32",
        "-lksuser",
        "-lmfplat",
        "-lmf",
        "-lmfuuid"
      ]
    }
  ]
}