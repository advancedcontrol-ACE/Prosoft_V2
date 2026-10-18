param(
    [string]$defaultPort = "COM4",
    [int]$defaultBaud = 9600
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -TypeDefinition @"
using System;
public class ModbusCRC {
    public static ushort CalculateCRC(byte[] buffer, int length) {
        ushort crc = 0xFFFF;
        for (int i = 0; i < length; i++) {
            crc ^= (ushort)buffer[i];
            for (int j = 0; j < 8; j++) {
                if ((crc & 0x0001) != 0) {
                    crc = (ushort)((crc >> 1) ^ 0xA001);
                } else {
                    crc = (ushort)(crc >> 1);
                }
            }
        }
        return crc;
    }
}
"@

$global:serialPort = $null
$global:lastState = @{
    pv = 0
    sp = 500
    autoMan = 0
    action = 0
    pb = 1000
    ti = 100
    td = 0
    bias = 500
    op = 0
}

function Send-ModbusFrame([byte[]]$pdu, [int]$expectedBytes, [int]$timeoutMs = 400) {
    if (-not $global:serialPort -or -not $global:serialPort.IsOpen) {
        return @{ error = "Port not open" }
    }

    try {
        $crc = [ModbusCRC]::CalculateCRC($pdu, $pdu.Length)
        $frame = [byte[]]@($pdu[0], $pdu[1], $pdu[2], $pdu[3], $pdu[4], $pdu[5], [byte]($crc -band 0xFF), [byte](($crc -shr 8) -band 0xFF))

        $global:serialPort.DiscardInBuffer()
        $global:serialPort.DiscardOutBuffer()
        $global:serialPort.Write($frame, 0, $frame.Length)

        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        while ($global:serialPort.BytesToRead -lt $expectedBytes -and $sw.ElapsedMilliseconds -lt $timeoutMs) {
            Start-Sleep -Milliseconds 5
        }

        $avail = $global:serialPort.BytesToRead
        if ($avail -ge $expectedBytes) {
            $buf = New-Object byte[] $avail
            $global:serialPort.Read($buf, 0, $avail)
            Start-Sleep -Milliseconds 25  # Half-duplex RS-485 transceiver turnaround pause
            return @{ success = $true; data = $buf }
        } else {
            Start-Sleep -Milliseconds 25
            return @{ error = "Timeout after ${timeoutMs}ms (got $avail of $expectedBytes bytes)" }
        }
    } catch {
        # Hardware unplugged while port was open: clean up handle immediately
        try { if ($global:serialPort) { $global:serialPort.Close(); $global:serialPort.Dispose() } } catch {}
        $global:serialPort = $null
        return @{ error = "Port I/O error: $($_.Exception.Message)" }
    }
}

function Read-Regs([int]$slaveId, [int]$addr, [int]$count) {
    $pdu = [byte[]]@([byte]$slaveId, 0x03, [byte](($addr -shr 8) -band 0xFF), [byte]($addr -band 0xFF), [byte](($count -shr 8) -band 0xFF), [byte]($count -band 0xFF))
    $exp = 5 + $count * 2
    $res = Send-ModbusFrame $pdu $exp 400
    if ($res.success) {
        $buf = $res.data
        if ($buf[1] -ne 0x03) {
            return @{ error = "Modbus exception $($buf[1]) code $($buf[2])" }
        }
        $vals = @()
        for ($i = 0; $i -lt $count; $i++) {
            $vals += ($buf[3 + $i * 2] * 256 + $buf[4 + $i * 2])
        }
        return @{ success = $true; values = $vals }
    }
    return $res
}

function Write-Reg([int]$slaveId, [int]$addr, [int]$val) {
    $pdu = [byte[]]@([byte]$slaveId, 0x06, [byte](($addr -shr 8) -band 0xFF), [byte]($addr -band 0xFF), [byte](($val -shr 8) -band 0xFF), [byte]($val -band 0xFF))
    $res = Send-ModbusFrame $pdu 8 500
    if ($res.success) {
        $buf = $res.data
        if ($buf[1] -ne 0x06) {
            return @{ error = "Modbus write exception $($buf[1])" }
        }
        $written = $buf[4] * 256 + $buf[5]
        return @{ success = $true; written = $written }
    }
    return $res
}

function Write-Bit([int]$slaveId, [int]$addr, [bool]$val) {
    $hi = if ($val) { [byte]0xFF } else { [byte]0x00 }
    $pdu = [byte[]]@([byte]$slaveId, 0x05, [byte](($addr -shr 8) -band 0xFF), [byte]($addr -band 0xFF), $hi, [byte]0x00)
    $res = Send-ModbusFrame $pdu 8 500
    if ($res.success) {
        return @{ success = $true }
    }
    return $res
}

Write-Output '{"status":"ready"}'

while ($true) {
    $line = [Console]::In.ReadLine()
    if ($null -eq $line) { break }
    if ($line.Trim() -eq "") { continue }

    try {
        $cmd = $line | ConvertFrom-Json
        $action = $cmd.cmd

        if ($action -eq "open") {
            $pName = if ($cmd.port) { $cmd.port } else { $defaultPort }
            $baud = if ($cmd.baud) { [int]$cmd.baud } else { $defaultBaud }
            if ($global:serialPort -and $global:serialPort.IsOpen) {
                $global:serialPort.Close()
            }
            $global:serialPort = New-Object System.IO.Ports.SerialPort($pName, $baud, [System.IO.Ports.Parity]::None, 8, [System.IO.Ports.StopBits]::One)
            $global:serialPort.ReadTimeout = 400
            $global:serialPort.WriteTimeout = 400
            $global:serialPort.Open()
            # Enable Communication Write-In (0810H) & Run (0814H) on controller
            $slaveId = if ($cmd.slaveId) { [int]$cmd.slaveId } else { 1 }
            Write-Bit $slaveId 0x0810 $true | Out-Null
            Write-Bit $slaveId 0x0814 $true | Out-Null
            Write-Output ((@{ status = "opened"; port = $pName; baud = $baud } | ConvertTo-Json -Compress))
        }
        elseif ($action -eq "close") {
            if ($global:serialPort -and $global:serialPort.IsOpen) {
                $global:serialPort.Close()
            }
            $global:serialPort = $null
            Write-Output '{"status":"closed"}'
        }
        elseif ($action -eq "poll_all") {
            $slaveId = if ($cmd.slaveId) { [int]$cmd.slaveId } else { 1 }

            # 1. PV & SP: 1000H, 1001H (count 2)
            $r1 = Read-Regs $slaveId 0x1000 2
            # 2. Auto/Manual & Action: 1005H, 1006H (count 2)
            $r2 = Read-Regs $slaveId 0x1005 2
            # 3. PB, Ti, Td, Bias: 1009H..100CH (count 4)
            $r3 = Read-Regs $slaveId 0x1009 4
            # 4. OP: 1012H (count 1)
            $r4 = Read-Regs $slaveId 0x1012 1

            if ($r1.success) {
                $global:lastState.pv = $r1.values[0]
                $global:lastState.sp = $r1.values[1]
            }
            if ($r2.success) {
                $global:lastState.autoMan = $r2.values[0]
                $global:lastState.action = $r2.values[1]
            }
            if ($r3.success) {
                $global:lastState.pb = $r3.values[0]
                $global:lastState.ti = $r3.values[1]
                $global:lastState.td = $r3.values[2]
                $global:lastState.bias = $r3.values[3]
            }
            if ($r4.success) {
                $global:lastState.op = $r4.values[0]
            }

            $pvRaw = $global:lastState.pv
            $spRaw = $global:lastState.sp
            $autoManRaw = $global:lastState.autoMan
            $actionRaw = $global:lastState.action
            $pbRaw = $global:lastState.pb
            $tiRaw = $global:lastState.ti
            $tdRaw = $global:lastState.td
            $biasRaw = $global:lastState.bias
            $opRaw = $global:lastState.op

            # Conversions per requirements:
            # PV: divided by 10
            # SP: divided by 10 (since stored multiplied by 10)
            # PB: divided by 10 (since stored multiplied by 10)
            # Action: 0 = Reverse, 1 = Direct
            # AutoMan: 2 = Manual, 0 = Auto
            $payload = @{
                status = "ok"
                timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                raw = @{
                    pv = $pvRaw; sp = $spRaw; autoMan = $autoManRaw; action = $actionRaw;
                    pb = $pbRaw; ti = $tiRaw; td = $tdRaw; bias = $biasRaw; op = $opRaw
                }
                pv = [Math]::Round(($pvRaw / 10.0), 1)
                sp = [Math]::Round(($spRaw / 10.0), 1)
                pb = [Math]::Round(($pbRaw / 10.0), 1)
                it = $tiRaw
                dt = $tdRaw
                bias = [Math]::Round(($biasRaw / 10.0), 1)
                op = [Math]::Round(($opRaw / 10.0), 1)
                autoMan = if ($autoManRaw -eq 2) { "Manual" } else { "Auto" }
                action = if ($actionRaw -eq 1 -or $actionRaw -eq 512) { "Direct" } else { "Reverse" }
            }
            Write-Output ($payload | ConvertTo-Json -Compress)
        }
        elseif ($action -eq "write_reg") {
            $slaveId = if ($cmd.slaveId) { [int]$cmd.slaveId } else { 1 }
            $addr = [int]$cmd.addr
            $val = [int]$cmd.val
            if ($addr -eq 0x0810 -or $addr -eq 0x0813 -or $addr -eq 0x0814) {
                $res = Write-Bit $slaveId $addr ($val -ne 0)
            } else {
                $res = Write-Reg $slaveId $addr $val
            }
            if ($res.success) {
                if ($addr -eq 0x1001) { $global:lastState.sp = $val }
                elseif ($addr -eq 0x1005) { $global:lastState.autoMan = $val }
                elseif ($addr -eq 0x1006) { $global:lastState.action = $val }
                elseif ($addr -eq 0x1009) { $global:lastState.pb = $val }
                elseif ($addr -eq 0x100A) { $global:lastState.ti = $val }
                elseif ($addr -eq 0x100B) { $global:lastState.td = $val }
                elseif ($addr -eq 0x100C) { $global:lastState.bias = $val }
                elseif ($addr -eq 0x1012) { $global:lastState.op = $val }
            }
            Write-Output ($res | ConvertTo-Json -Compress)
        }
        elseif ($action -eq "quit") {
            if ($global:serialPort -and $global:serialPort.IsOpen) {
                $global:serialPort.Close()
            }
            break
        }
        else {
            Write-Output '{"error":"unknown command"}'
        }
    } catch {
        Write-Output ((@{ error = $_.Exception.Message } | ConvertTo-Json -Compress))
    }
}
