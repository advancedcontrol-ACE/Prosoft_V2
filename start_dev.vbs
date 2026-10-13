Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\ACE\Prosoft_V2"
WshShell.Run "cmd.exe /c npm run dev", 0, False
