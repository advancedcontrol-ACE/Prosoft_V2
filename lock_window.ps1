param(
    [switch]$CheckOnly
)

$code = @'
using System;
using System.Text;
using System.Runtime.InteropServices;

public class WindowLocker {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll")]
    public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    public const int SW_MAXIMIZE = 3;
    public const int GWL_STYLE = -16;
    public const int WS_THICKFRAME = 0x00040000;
    public const int WS_MAXIMIZEBOX = 0x00010000;
    public const uint SWP_FLAGS = 0x0027; // SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER

    public static bool LockTargetWindow(string targetTitle) {
        bool locked = false;
        EnumWindows((hWnd, lParam) => {
            if (IsWindowVisible(hWnd)) {
                var sb = new StringBuilder(512);
                GetWindowText(hWnd, sb, 512);
                string title = sb.ToString();
                if (!string.IsNullOrEmpty(title) && title.IndexOf(targetTitle, StringComparison.OrdinalIgnoreCase) >= 0) {
                    ShowWindow(hWnd, SW_MAXIMIZE);
                    SetForegroundWindow(hWnd);
                    int style = GetWindowLong(hWnd, GWL_STYLE);
                    style &= ~WS_THICKFRAME;
                    style &= ~WS_MAXIMIZEBOX;
                    SetWindowLong(hWnd, GWL_STYLE, style);
                    SetWindowPos(hWnd, IntPtr.Zero, 0, 0, 0, 0, SWP_FLAGS);
                    locked = true;
                    return false;
                }
            }
            return true;
        }, IntPtr.Zero);
        return locked;
    }
}
'@
Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue

$targetTitle = "Advanced Control Equipments"

if ($CheckOnly) {
    $found = [WindowLocker]::LockTargetWindow($targetTitle)
    if ($found) {
        exit 0
    } else {
        exit 1
    }
}

$sw = [System.Diagnostics.Stopwatch]::StartNew()
while ($sw.ElapsedMilliseconds -lt 15000) {
    if ([WindowLocker]::LockTargetWindow($targetTitle)) {
        exit 0
    }
    Start-Sleep -Milliseconds 250
}
exit 1
