!macro customInstall
  CreateDirectory "C:\Program Files (x86)\Common Files\Microsoft Shared\Power BI Desktop\External Tools"
  CopyFiles /SILENT "$INSTDIR\resources\namascolor.pbitool.json" "C:\Program Files (x86)\Common Files\Microsoft Shared\Power BI Desktop\External Tools\namascolor.pbitool.json"
!macroend

!macro customUnInstall
  Delete "C:\Program Files (x86)\Common Files\Microsoft Shared\Power BI Desktop\External Tools\namascolor.pbitool.json"
!macroend
