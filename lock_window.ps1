param(
    [switch]$CheckOnly
)

Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue

$code = @'
using System;
using System.Text;
using System.Diagnostics;
using System.Runtime.InteropServices;

public class WindowLocker {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    public delegate IntPtr LowLevelMouseProc(int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool IsWindow(IntPtr hWnd);

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

    [DllImport("user32.dll")]
    public static extern IntPtr GetSystemMenu(IntPtr hWnd, bool bRevert);

    [DllImport("user32.dll")]
    public static extern int GetMenuItemCount(IntPtr hMenu);

    [DllImport("user32.dll")]
    public static extern bool RemoveMenu(IntPtr hMenu, uint uPosition, uint uFlags);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT {
        public int x;
        public int y;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct MSLLHOOKSTRUCT {
        public POINT pt;
        public uint mouseData;
        public uint flags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SetWindowsHookEx(int idHook, LowLevelMouseProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll")]
    public static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern IntPtr GetModuleHandle(string lpModuleName);

    public const int SW_MAXIMIZE = 3;
    public const int GWL_STYLE = -16;
    public const int WS_THICKFRAME = 0x00040000;
    public const int WS_MAXIMIZEBOX = 0x00010000;
    public const int WS_SYSMENU = 0x00080000;
    public const uint SWP_FLAGS = 0x0027; // SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER

    public const uint MF_BYPOSITION = 0x0400;
    public const uint MF_REMOVE = 0x1000;

    public const int WH_MOUSE_LL = 14;
    public const int WM_RBUTTONDOWN = 0x0204;
    public const int WM_RBUTTONUP = 0x0205;
    public const int WM_NCRBUTTONDOWN = 0x00A4;
    public const int WM_NCRBUTTONUP = 0x00A5;

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();

    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SystemParametersInfo(uint uiAction, uint uiParam, IntPtr pvParam, uint fWinIni);

    public const uint SPI_SETFOREGROUNDLOCKTIMEOUT = 0x2001;
    public const uint SPIF_SENDCHANGE = 0x02;

    public static IntPtr TargetHWnd = IntPtr.Zero;
    private static IntPtr _hookId = IntPtr.Zero;
    private static LowLevelMouseProc _proc = HookCallback;

    public static void ForceForegroundWindow(IntPtr hWnd) {
        if (hWnd == IntPtr.Zero) return;
        try {
            SystemParametersInfo(SPI_SETFOREGROUNDLOCKTIMEOUT, 0, IntPtr.Zero, SPIF_SENDCHANGE);
            IntPtr foreHWnd = GetForegroundWindow();
            uint dummyProcId;
            uint foreThread = GetWindowThreadProcessId(foreHWnd, out dummyProcId);
            uint currentThread = GetCurrentThreadId();
            uint targetThread = GetWindowThreadProcessId(hWnd, out dummyProcId);

            if (foreThread != 0 && foreThread != currentThread) {
                AttachThreadInput(currentThread, foreThread, true);
            }
            if (foreThread != 0 && foreThread != targetThread) {
                AttachThreadInput(targetThread, foreThread, true);
            }

            keybd_event(0x12, 0, 0, 0); // Alt down
            keybd_event(0x12, 0, 2, 0); // Alt up

            ShowWindow(hWnd, SW_MAXIMIZE);
            BringWindowToTop(hWnd);
            SetForegroundWindow(hWnd);
            SwitchToThisWindow(hWnd, true);

            if (foreThread != 0 && foreThread != currentThread) {
                AttachThreadInput(currentThread, foreThread, false);
            }
            if (foreThread != 0 && foreThread != targetThread) {
                AttachThreadInput(targetThread, foreThread, false);
            }
        } catch { }
    }

    public static bool LockTargetWindow(string targetTitle) {
        bool locked = false;
        EnumWindows((hWnd, lParam) => {
            if (IsWindowVisible(hWnd)) {
                var sb = new StringBuilder(512);
                GetWindowText(hWnd, sb, 512);
                string title = sb.ToString();
                if (!string.IsNullOrEmpty(title) && title.IndexOf(targetTitle, StringComparison.OrdinalIgnoreCase) >= 0) {
                    TargetHWnd = hWnd;
                    ForceForegroundWindow(hWnd);
                    int style = GetWindowLong(hWnd, GWL_STYLE);
                    style &= ~WS_THICKFRAME;
                    style &= ~WS_MAXIMIZEBOX;
                    style &= ~WS_SYSMENU;
                    SetWindowLong(hWnd, GWL_STYLE, style);
                    SetWindowPos(hWnd, IntPtr.Zero, 0, 0, 0, 0, SWP_FLAGS);

                    // Clear native Win32 system menu items
                    IntPtr hMenu = GetSystemMenu(hWnd, false);
                    if (hMenu != IntPtr.Zero) {
                        int count = GetMenuItemCount(hMenu);
                        for (int i = count - 1; i >= 0; i--) {
                            RemoveMenu(hMenu, (uint)i, MF_BYPOSITION | MF_REMOVE);
                        }
                    }

                    locked = true;
                    return false;
                }
            }
            return true;
        }, IntPtr.Zero);
        return locked;
    }

    public static void StartTopBarHook() {
        if (_hookId == IntPtr.Zero && TargetHWnd != IntPtr.Zero) {
            using (Process curProcess = Process.GetCurrentProcess())
            using (ProcessModule curModule = curProcess.MainModule) {
                _hookId = SetWindowsHookEx(WH_MOUSE_LL, _proc, GetModuleHandle(curModule.ModuleName), 0);
            }
        }
    }

    public static void StopTopBarHook() {
        if (_hookId != IntPtr.Zero) {
            UnhookWindowsHookEx(_hookId);
            _hookId = IntPtr.Zero;
        }
    }

    private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
        if (nCode >= 0 && TargetHWnd != IntPtr.Zero && IsWindow(TargetHWnd)) {
            int msg = wParam.ToInt32();
            if (msg == WM_RBUTTONDOWN || msg == WM_RBUTTONUP || msg == WM_NCRBUTTONDOWN || msg == WM_NCRBUTTONUP) {
                MSLLHOOKSTRUCT hookStruct = (MSLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(MSLLHOOKSTRUCT));
                RECT rect;
                if (GetWindowRect(TargetHWnd, out rect)) {
                    // Top bar is the top 44 pixels of the window
                    if (hookStruct.pt.x >= rect.Left && hookStruct.pt.x <= rect.Right &&
                        hookStruct.pt.y >= rect.Top && hookStruct.pt.y <= (rect.Top + 44)) {
                        return (IntPtr)1; // Suppress right-click on the top bar!
                    }
                }
            }
        }
        return CallNextHookEx(_hookId, nCode, wParam, lParam);
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
$found = $false
while ($sw.ElapsedMilliseconds -lt 15000) {
    if ([WindowLocker]::LockTargetWindow($targetTitle)) {
        $found = $true
        break
    }
    Start-Sleep -Milliseconds 250
}

if ($found) {
    [WindowLocker]::StartTopBarHook()
    # Keep the top-bar right click interceptor active while the window is running
    while ([WindowLocker]::IsWindow([WindowLocker]::TargetHWnd)) {
        [System.Windows.Forms.Application]::DoEvents()
        Start-Sleep -Milliseconds 150
    }
    [WindowLocker]::StopTopBarHook()
    exit 0
}

exit 1
