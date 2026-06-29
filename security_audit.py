# security_audit.py
# Deep Forensic Security Audit Tool for Windows
# Designed by Antigravity AI for Sharoz's laptop

import os
import sys
import json
import winreg
import subprocess
import socket

# Try importing psutil; it might be installing in the background
try:
    import psutil
except ImportError:
    psutil = None

# Known Remote Access Tools (RATs) and Screen Sharing processes
RAT_PROCESSES = {
    "anydesk.exe": "AnyDesk (Remote Access Tool)",
    "teamviewer.exe": "TeamViewer (Remote Access Tool)",
    "teamviewer_service.exe": "TeamViewer Service (Remote Access Tool)",
    "rustdesk.exe": "RustDesk (Open Source Remote Desktop)",
    "winvnc.exe": "VNC Server (Remote Desktop)",
    "vncserver.exe": "VNC Server (Remote Desktop)",
    "remoting_host.exe": "Chrome Remote Desktop Host",
    "dwagent.exe": "DWService Agent (Remote Access)",
    "radmin.exe": "Radmin (Remote Administrator)",
    "parsecd.exe": "Parsec (Remote Desktop/Gaming Access)",
    "ammyy.exe": "Ammyy Admin (Remote Access)",
    "screenconnect.client.exe": "ConnectWise ScreenConnect Client",
    "screenconnect.service.exe": "ConnectWise ScreenConnect Service System",
    "splashtop.exe": "Splashtop Remote Desktop",
    "srservice.exe": "Splashtop Remote Service",
}

def check_rdp_settings():
    """Reads Windows Registry keys to determine if Remote Desktop is enabled."""
    rdp_info = {}
    try:
        # Check Terminal Server RDP status
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"System\CurrentControlSet\Control\Terminal Server", 0, winreg.KEY_READ)
        try:
            fDenyTSConnections, _ = winreg.QueryValueEx(key, "fDenyTSConnections")
            rdp_info["rdp_enabled"] = (fDenyTSConnections == 0)
        except Exception:
            rdp_info["rdp_enabled"] = False
        
        try:
            fAllowToGetHelp, _ = winreg.QueryValueEx(key, "fAllowToGetHelp")
            rdp_info["remote_assistance_enabled"] = (fAllowToGetHelp == 1)
        except Exception:
            rdp_info["remote_assistance_enabled"] = False
        winreg.CloseKey(key)
        
        # Check Port 3389 Registry setting
        try:
            port_key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp", 0, winreg.KEY_READ)
            port_number, _ = winreg.QueryValueEx(port_key, "PortNumber")
            rdp_info["rdp_port"] = port_number
            winreg.CloseKey(port_key)
        except Exception:
            rdp_info["rdp_port"] = 3389
            
    except Exception as e:
        rdp_info["error"] = f"Registry access failed: {str(e)}. (Run as Administrator to fix)"
        rdp_info["rdp_enabled"] = False
        rdp_info["remote_assistance_enabled"] = False
    return rdp_info

def check_active_rats():
    """Scans running processes for known Remote Access Tools."""
    detected = []
    if not psutil:
        return [{"error": "psutil library not installed"}]
        
    for proc in psutil.process_iter(['pid', 'name', 'exe', 'username', 'create_time']):
        try:
            name_lower = proc.info['name'].lower() if proc.info['name'] else ""
            if name_lower in RAT_PROCESSES:
                detected.append({
                    "pid": proc.info['pid'],
                    "name": proc.info['name'],
                    "description": RAT_PROCESSES[name_lower],
                    "path": proc.info['exe'],
                    "username": proc.info['username'],
                    "created": proc.info['create_time']
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    return detected

def read_registry_run(hive, path):
    """Utility to read Registry Autorun keys."""
    items = []
    try:
        key = winreg.OpenKey(hive, path, 0, winreg.KEY_READ)
        info = winreg.QueryInfoKey(key)
        for i in range(info[1]):
            val = winreg.EnumValue(key, i)
            items.append({
                "name": val[0],
                "value": val[1]
            })
        winreg.CloseKey(key)
    except Exception:
        pass
    return items

def check_startup_persistence():
    """Scans common Registry autorun keys and Startup folders for persistent programs."""
    persistence = {
        "hkcu_run": read_registry_run(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run"),
        "hkcu_run_once": read_registry_run(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\RunOnce"),
        "hklm_run": read_registry_run(winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\Run"),
        "hklm_run_once": read_registry_run(winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\RunOnce"),
        "startup_folder_user": [],
        "startup_folder_common": []
    }
    
    # Check User Startup folder
    user_startup = os.path.expandvars(r"%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup")
    if os.path.exists(user_startup):
        persistence["startup_folder_user"] = os.listdir(user_startup)
        
    # Check Common Startup folder
    common_startup = os.path.expandvars(r"%ProgramData%\Microsoft\Windows\Start Menu\Programs\Startup")
    if os.path.exists(common_startup):
        persistence["startup_folder_common"] = os.listdir(common_startup)
        
    return persistence

def check_active_sessions():
    """Queries logged-in users and terminal sessions."""
    sessions = []
    
    # Try running qwinsta (Query Window Station)
    try:
        result = subprocess.run(["qwinsta"], capture_output=True, text=True, check=True)
        lines = result.stdout.strip().split('\n')
        # Skip header
        for line in lines[1:]:
            parts = line.split()
            if len(parts) >= 2:
                session_name = parts[0]
                username = ""
                session_id = ""
                state = ""
                
                # Parse based on columns
                # qwinsta output is column-fixed but parts split usually separates them
                if len(parts) >= 4:
                    if parts[1].isdigit():
                        # Session name, ID, State, ...
                        session_id = parts[1]
                        state = parts[2]
                    else:
                        # Session name, Username, ID, State, ...
                        username = parts[1]
                        session_id = parts[2]
                        state = parts[3]
                else:
                    session_id = parts[-2]
                    state = parts[-1]
                
                sessions.append({
                    "session_name": session_name,
                    "username": username,
                    "id": session_id,
                    "state": state
                })
    except Exception as e:
        # Fallback to query user
        try:
            result = subprocess.run(["query", "user"], capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                for line in lines[1:]:
                    parts = line.split()
                    if parts:
                        sessions.append({
                            "username": parts[0],
                            "session_name": parts[1] if len(parts) > 1 else "",
                            "id": parts[2] if len(parts) > 2 else "",
                            "state": parts[3] if len(parts) > 3 else "Active"
                        })
        except Exception:
            pass
            
    return sessions

def check_local_users():
    """Lists local user accounts on the machine."""
    users = []
    try:
        # Use net user to get list of local accounts
        result = subprocess.run(["net", "user"], capture_output=True, text=True)
        if result.returncode == 0:
            lines = result.stdout.split('\n')
            # Look for lines that contain usernames (skip headers/footers)
            start_parsing = False
            for line in lines:
                if "----------------------------------" in line:
                    start_parsing = True
                    continue
                if start_parsing:
                    if "The command completed successfully" in line:
                        break
                    names = [name.strip() for name in line.split() if name.strip()]
                    users.extend(names)
    except Exception:
        pass
    
    # Try to find admins
    admins = []
    try:
        result = subprocess.run(["net", "localgroup", "administrators"], capture_output=True, text=True)
        if result.returncode == 0:
            lines = result.stdout.split('\n')
            start_parsing = False
            for line in lines:
                if "----------------------------------" in line:
                    start_parsing = True
                    continue
                if start_parsing:
                    if "The command completed successfully" in line:
                        break
                    if line.strip():
                        admins.append(line.strip())
    except Exception:
        pass
        
    return {
        "all_users": users,
        "administrators": admins
    }

def check_established_connections():
    """Finds all active external TCP/UDP connections."""
    conns = []
    if not psutil:
        return conns
        
    for conn in psutil.net_connections(kind='inet'):
        if conn.status in ('ESTABLISHED', 'LISTEN'):
            # Ignore local loopbacks
            if conn.raddr and conn.raddr.ip in ('127.0.0.1', '::1', '0.0.0.0', '::'):
                continue
            if conn.laddr and conn.laddr.ip in ('127.0.0.1', '::1'):
                continue
                
            # Get process info
            proc_name = "System/Unknown"
            proc_path = ""
            proc_username = ""
            if conn.pid:
                try:
                    p = psutil.Process(conn.pid)
                    proc_name = p.name()
                    proc_path = p.exe()
                    proc_username = p.username()
                except Exception:
                    pass
            
            conns.append({
                "pid": conn.pid,
                "process_name": proc_name,
                "process_path": proc_path,
                "username": proc_username,
                "local_ip": conn.laddr.ip if conn.laddr else "",
                "local_port": conn.laddr.port if conn.laddr else None,
                "remote_ip": conn.raddr.ip if conn.raddr else "",
                "remote_port": conn.raddr.port if conn.raddr else None,
                "status": conn.status
            })
    return conns

def audit_security_event_logs():
    """Queries Windows Event Logs for logon activities using PowerShell."""
    # We fetch Event ID 4624 (Logon success) and Event ID 4625 (Logon failure)
    # Filter for LogonType 10 (RemoteInteractive/RDP) or LogonType 3 (Network logon)
    events = []
    
    ps_command = (
        "Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4624} -MaxEvents 30 -ErrorAction SilentlyContinue | "
        "Select-Object TimeCreated, Id, "
        "@{Name='TargetUserName';Expression={$_.Properties[5].Value}}, "
        "@{Name='LogonType';Expression={$_.Properties[8].Value}}, "
        "@{Name='IpAddress';Expression={$_.Properties[18].Value}} | "
        "ConvertTo-Json -Depth 2"
    )
    
    try:
        result = subprocess.run(
            ["powershell", "-Command", ps_command],
            capture_output=True,
            text=True
        )
        if result.returncode == 0 and result.stdout.strip():
            # Check if it returned an array or single object
            raw_json = result.stdout.strip()
            data = json.loads(raw_json)
            if isinstance(data, dict):
                data = [data]
            
            for item in data:
                # Format DateTime
                time_str = item.get("TimeCreated", "")
                if "/Date(" in time_str:
                    # Parse PowerShell Date serialization /Date(1234567890)/
                    try:
                        millis = int(time_str.split("(")[1].split(")")[0])
                        import datetime
                        time_str = datetime.datetime.fromtimestamp(millis / 1000.0).isoformat()
                    except Exception:
                        pass
                
                logon_type = item.get("LogonType", 0)
                logon_type_desc = "Unknown"
                # Logon type descriptions:
                # 2: Interactive (Keyboard/Screen)
                # 3: Network (e.g. shared folder, API connection)
                # 4: Batch (scheduled task)
                # 5: Service
                # 7: Unlock
                # 8: NetworkCleartext (IIS logon)
                # 9: NewCredentials
                # 10: RemoteInteractive (RDP)
                # 11: CachedInteractive
                if logon_type == 2: logon_type_desc = "Local Keyboard/Screen"
                elif logon_type == 3: logon_type_desc = "Network Connection (Shared File/Port)"
                elif logon_type == 4: logon_type_desc = "Batch / Scheduled Task"
                elif logon_type == 5: logon_type_desc = "System Service"
                elif logon_type == 7: logon_type_desc = "Screen Unlock"
                elif logon_type == 10: logon_type_desc = "Remote Desktop (RDP)"
                elif logon_type == 11: logon_type_desc = "Cached Login"
                
                events.append({
                    "time": time_str,
                    "username": item.get("TargetUserName", "Unknown"),
                    "logon_type": logon_type,
                    "logon_type_desc": logon_type_desc,
                    "ip_address": item.get("IpAddress", "-")
                })
    except Exception as e:
        return {"error": f"Requires administrator rights or Event Log service disabled: {str(e)}"}
        
    return events

def run_audit():
    """Runs all audit checks and returns a summary dict."""
    return {
        "timestamp": subprocess.check_output(["powershell", "Get-Date -Format o"]).decode().strip() if sys.platform == "win32" else "",
        "rdp_settings": check_rdp_settings(),
        "active_rats": check_active_rats(),
        "startup_persistence": check_startup_persistence(),
        "active_sessions": check_active_sessions(),
        "local_users": check_local_users(),
        "active_connections": check_established_connections(),
        "security_logon_events": audit_security_event_logs()
    }

if __name__ == "__main__":
    print("Running Security Audit... Please wait.")
    report = run_audit()
    print(json.dumps(report, indent=2))
