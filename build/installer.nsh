!macro customInstall
  ; Register NamasColor as Power BI External Tool
  SetOutPath "$INSTDIR"

  ; Create External Tools directory if it doesn't exist
  CreateDirectory "C:\Program Files (x86)\Common Files\Microsoft Shared\Power BI Desktop\External Tools"

  ; Write the pbitool.json with correct install path
  FileOpen $0 "C:\Program Files (x86)\Common Files\Microsoft Shared\Power BI Desktop\External Tools\namascolor.pbitool.json" w
  FileWrite $0 '{"version":"1.0.0","name":"NamasColor","description":"Color Picker para Power BI","path":"$INSTDIR\NamasColor.exe","iconData":"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI2IiBmaWxsPSIjRTg0NDNBIi8+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iU2Vnb2UgVUkiIGZvbnQtd2VpZ2h0PSI4MDAiIGZvbnQtc2l6ZT0iMTQiPk5DPC90ZXh0Pjwvc3ZnPg=="}'
  FileClose $0
!macroend

!macro customUnInstall
  ; Remove External Tool registration
  Delete "C:\Program Files (x86)\Common Files\Microsoft Shared\Power BI Desktop\External Tools\namascolor.pbitool.json"
!macroend
