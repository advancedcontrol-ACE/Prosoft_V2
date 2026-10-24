' ==============================================================================
' ACE Prosoft V2.0 — Native Windows Graphical Setup Launcher (No PowerShell Needed)
' ==============================================================================
Option Explicit

Dim email, pass, http, url, payload, responseText, fso, shell, appData, configDir, stream
Dim scriptDir, installerPath, downloadUrl, choice

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Prompt for Email
email = InputBox("Enter your College Email ID (Login ID):", "ACE Prosoft V2.0 — Activation", "")
If Trim(email) = "" Then WScript.Quit

' Prompt for Password
pass = InputBox("Enter your Password:", "ACE Prosoft V2.0 — Activation", "")
If Trim(pass) = "" Then WScript.Quit

url = "https://admin-portal-sable-omega.vercel.app/api/auth-install"
payload = "{""email"":""" & email & """,""password"":""" & pass & """,""machineName"":""" & shell.ExpandEnvironmentStrings("%COMPUTERNAME%") & """}"

On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
If http Is Nothing Then
    Set http = CreateObject("MSXML2.ServerXMLHTTP")
End If

http.Open "POST", url, False
http.setRequestHeader "Content-Type", "application/json"
http.Send payload

If Err.Number <> 0 Then
    MsgBox "Network Connection Error: " & Err.Description & vbCrLf & vbCrLf & "Please check your internet connection.", 16, "ACE Prosoft V2 — Error"
    WScript.Quit
End If
On Error GoTo 0

responseText = http.responseText

If InStr(responseText, """success"":true") > 0 Then
    appData = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%")
    configDir = appData & "\ACE_Prosoft_V2"

    If Not fso.FolderExists(configDir) Then
        fso.CreateFolder(configDir)
    End If

    ' Write entitlement profile
    Set stream = fso.CreateTextFile(configDir & "\installed_modules.json", True)
    stream.Write responseText
    stream.Close

    ' Check if installer setup executable is in the same folder or in Downloads or Temp
    scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
    installerPath = ""

    If fso.FileExists(scriptDir & "\ACE Prosoft V2 Setup 2.0.0.exe") Then
        installerPath = scriptDir & "\ACE Prosoft V2 Setup 2.0.0.exe"
    ElseIf fso.FileExists(scriptDir & "\ACE.Prosoft.V2.Setup.1.0.0.exe") Then
        installerPath = scriptDir & "\ACE.Prosoft.V2.Setup.1.0.0.exe"
    ElseIf fso.FileExists(scriptDir & "\ACE Prosoft V2 Setup.exe") Then
        installerPath = scriptDir & "\ACE Prosoft V2 Setup.exe"
    ElseIf fso.FileExists(shell.ExpandEnvironmentStrings("%TEMP%") & "\ACE_Prosoft_Setup.exe") Then
        installerPath = shell.ExpandEnvironmentStrings("%TEMP%") & "\ACE_Prosoft_Setup.exe"
    End If

    If installerPath <> "" Then
        MsgBox "Authentication Successful!" & vbCrLf & vbCrLf & _
               "Customer: " & email & vbCrLf & _
               "Authorized modules configured." & vbCrLf & vbCrLf & _
               "Starting the ACE Prosoft V2 installation wizard now...", 64, "ACE Prosoft V2.0"
        shell.Run """" & installerPath & """", 1, False
    Else
        Dim tempExe
        tempExe = shell.ExpandEnvironmentStrings("%TEMP%") & "\ACE.Prosoft.V2.Setup.2.0.0.exe"
        downloadUrl = "https://github.com/meenasundaratgmaildotcom/ACE-Prosoft-Releases/releases/download/v2.0.0/ACE.Prosoft.V2.Setup.2.0.0.exe"

        If fso.FileExists(tempExe) Then
            MsgBox "Authentication Successful!" & vbCrLf & vbCrLf & _
                   "Launching ACE Prosoft V2 setup wizard now...", 64, "ACE Prosoft V2.0"
            shell.Run """" & tempExe & """", 1, False
        Else
            ' Direct online download and execution
            MsgBox "Authentication Successful!" & vbCrLf & vbCrLf & _
                   "Customer: " & email & vbCrLf & _
                   "Your licensed modules (ACE 101, 401, 403, 404) have been registered." & vbCrLf & vbCrLf & _
                   "Click OK to download the official installer directly from cloud and launch installation.", 64, "ACE Prosoft V2.0 — Starting Setup"

            ' Run visible download with progress bar and auto-execute when 100% complete
            shell.Run "cmd.exe /c title ACE Prosoft V2.0 Cloud Downloader && echo =================================================== && echo   Downloading ACE Prosoft V2.0 Setup (123 MB)... && echo =================================================== && (curl.exe -# -L -o """ & tempExe & """ """ & downloadUrl & """ || bitsadmin.exe /transfer ACEJob /download /priority FOREGROUND """ & downloadUrl & """ """ & tempExe & """) && echo. && echo Download complete! Starting installer... && """ & tempExe & """", 1, False
        End If
    End If
Else
    MsgBox "Activation Failed!" & vbCrLf & vbCrLf & responseText, 16, "ACE Prosoft V2.0 — Error"
End If
