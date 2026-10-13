Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\ACE\Prosoft_V2"
WshShell.Run "cmd.exe /c Launch_ACE_Prosoft.bat", 0, False
