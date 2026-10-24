Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\ACE\Prosoft_V2"
WshShell.Run "cmd.exe /c Launch_ACE_Prosoft.bat", 0, False
WScript.Sleep 1500
WshShell.AppActivate "Advanced Control Equipments"
