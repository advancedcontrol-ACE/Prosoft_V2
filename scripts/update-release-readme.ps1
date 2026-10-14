$readmeText = @'
# ACE Prosoft V2 — Official Downloads & Releases

Official distribution repository for **ACE Process Control Software (Prosoft V2)** with Delta DTB9696 Modbus RTU and Remote Lab Client/Host capability.

---

### ⚡ Ultra-Quick 1-Line PowerShell Install

Open Windows PowerShell on any PC and paste this short command:

```powershell
irm tinyurl.com/ace-setup | iex
```
*(or `irm tinyurl.com/aceprosoft-v2 | iex`)*

This automatically downloads the setup and launches the installer window immediately!

---

### 🚀 Direct Browser Download

Alternatively, download the `.exe` installer directly:

👉 **[Download ACE Prosoft V2 Setup (v1.0.0)](https://github.com/meenasundaratgmaildotcom/ACE-Prosoft-Releases/releases/latest/download/ACE.Prosoft.V2.Setup.1.0.0.exe)**

*(File size: ~94.9 MB • Standalone .exe • No Node.js or developer tools required)*

---

### 🌐 Connecting as a Remote Student
1. Launch **ACE Prosoft V2** from your Desktop shortcut.
2. In the top menu, click **COM Port** → **Communication Setup & Remote Lab...**
3. Select the **🌐 Remote Lab Client (Student Mode)** tab.
4. Enter the **Host URL** (e.g. `https://xxxx.trycloudflare.com`) and the **Access Passkey** (e.g. `ACE-101`) provided by your instructor.
5. Click **Connect to Remote Lab** to begin receiving real-time hardware data!
'@

$bytes = [System.Text.Encoding]::UTF8.GetBytes($readmeText)
$b64 = [Convert]::ToBase64String($bytes)
$sha = (gh api repos/meenasundaratgmaildotcom/ACE-Prosoft-Releases/contents/README.md --jq .sha)

gh api --method PUT repos/meenasundaratgmaildotcom/ACE-Prosoft-Releases/contents/README.md -f message='Add ultra-short PowerShell install command to README' -f content="$b64" -f sha="$sha"
