# security_agent.py
# System Tray Agent and Real-Time Connection/Process Monitor (Auto-Pilot Edition)
# Designed by Antigravity AI for Sharoz's laptop

import os
import sys
import json
import time
import queue
import socket
import threading
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
import tkinter as tk
from tkinter import ttk

# Import psutil and pystray
import psutil
import pystray
from PIL import Image, ImageDraw

# Configurations
API_PORT = 8000
RULES_FILE = "security_rules.json"

# In-memory logs (limit to 100)
security_logs = []
logs_lock = threading.Lock()

# Thread-safe queue for UI alerts
alert_queue = queue.Queue()

# Global state
rules = {
    "blocked_ips": [],
    "blocked_processes": [],
    "allowed_ips": [],
    "allowed_processes": []
}
rules_lock = threading.Lock()

# Auto-Pilot State (default to False as requested by user)
auto_mode = False
auto_mode_lock = threading.Lock()

# Currently active alert dialog state
active_alert = None
active_alert_lock = threading.Lock()

# Load existing rules
if os.path.exists(RULES_FILE):
    try:
        with open(RULES_FILE, "r") as f:
            rules.update(json.load(f))
    except Exception:
        pass

def save_rules():
    with rules_lock:
        try:
            with open(RULES_FILE, "w") as f:
                json.dump(rules, f, indent=2)
        except Exception:
            pass

def explain_process(proc_name, path, ip=None, port=None):
    """Translates technical processes/connections into simple, non-technical words."""
    proc_name_lower = proc_name.lower()
    path_lower = path.lower() if path else ""
    
    # 1. Remote Desktop & Control Tools (RATs)
    from security_audit import RAT_PROCESSES
    if proc_name_lower in RAT_PROCESSES:
        return "Warning! A Remote Desktop / Screen Sharing tool is running. Someone might be trying to see or control your screen."
    if "anydesk" in proc_name_lower or "teamviewer" in proc_name_lower or "rustdesk" in proc_name_lower:
        return "Warning! A Remote Desktop / Screen Sharing tool is running. Someone might be trying to see or control your screen."
        
    # 2. Browsers
    if proc_name_lower in ["chrome.exe", "msedge.exe", "firefox.exe", "opera.exe", "brave.exe", "iexplore.exe"]:
        name = proc_name[:-4].capitalize()
        if ip:
            return f"Your web browser ({name}) is trying to load a website or web service."
        return f"Your web browser ({name}) is starting up."
        
    # 3. Development Tools / System Shells / Scripting
    if proc_name_lower in ["node.exe", "node_repl.exe", "python.exe", "py.exe", "powershell.exe", "cmd.exe", "wscript.exe", "cscript.exe", "bash.exe"]:
        shell_desc = "programming tool / system command terminal"
        if "node" in proc_name_lower:
            shell_desc = "Node.js coding service"
        elif "python" in proc_name_lower:
            shell_desc = "Python script runner"
            
        if ip:
            return f"A {shell_desc} is trying to connect to a server on the internet."
        return f"A {shell_desc} has started running on your computer."
        
    # 4. Messaging & Meetings
    if proc_name_lower in ["discord.exe", "slack.exe", "teams.exe", "zoom.exe", "whatsapp.exe", "skype.exe"]:
        name = proc_name[:-4].capitalize()
        return f"Your chat/meeting application ({name}) is sending data to its servers."
        
    # 5. Core Windows services
    if proc_name_lower in ["svchost.exe", "explorer.exe", "lsass.exe", "services.exe", "spoolsv.exe", "taskhostw.exe"]:
        return "A standard Windows system service is doing routine background tasks."
        
    # Generic
    if ip:
        return f"The program '{proc_name}' is trying to send data out to the internet."
    return f"The program '{proc_name}' has started running."

def log_event(event_type, source, detail, action, explanation=""):
    """Adds a security log entry in a thread-safe manner."""
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%S")
    if not explanation:
        explanation = explain_process(source, "", None, None)
        
    log_entry = {
        "timestamp": timestamp,
        "type": event_type,
        "source": source,
        "detail": detail,
        "action": action,
        "explanation": explanation
    }
    with logs_lock:
        security_logs.insert(0, log_entry)
        if len(security_logs) > 100:
            security_logs.pop()
    print(f"[{timestamp}] [{event_type.upper()}] {source} ({action}): {detail}")

# =====================================================================
# Core Monitoring Logic
# =====================================================================

def is_private_ip(ip):
    """Checks if an IP is a private/local IP to avoid alerting on local traffic."""
    if not ip:
        return True
    try:
        if ip in ("127.0.0.1", "::1", "0.0.0.0", "::"):
            return True
        parts = list(map(int, ip.split('.')))
        if parts[0] == 10:
            return True
        if parts[0] == 172 and (16 <= parts[1] <= 31):
            return True
        if parts[0] == 192 and parts[1] == 168:
            return True
        if parts[0] >= 224:
            return True
    except Exception:
        if ip.startswith("fe80") or ip.startswith("::"):
            return True
    return False

def is_safe_process(proc_name, path):
    """Checks if a process is trusted to avoid spamming alerts on development/system tools."""
    if not proc_name:
        return False
    proc_name_lower = proc_name.lower()
    path_lower = path.lower() if path else ""
    
    # Whitelist AI coding assistant processes & its components
    if "language_server.exe" in proc_name_lower or "language_server" in proc_name_lower:
        return True
    if "antigravity" in path_lower:
        return True
    if ".gemini" in path_lower:
        return True
    if "claude.exe" in proc_name_lower or "claude" in proc_name_lower:
        return True
    if "cowork-svc.exe" in proc_name_lower:
        return True
    if "codex.exe" in proc_name_lower or "codex" in proc_name_lower:
        return True
        
    # Whitelist the security agent itself to prevent self-monitoring loop
    if "security_agent.py" in path_lower or "security_audit.py" in path_lower:
        return True
        
    # Whitelist local npm / node.exe running Vite development server
    if proc_name_lower == "node.exe" and ("proud-lavoisier" in path_lower or "npm" in path_lower):
        return True
        
    return False

def block_ip_firewall(ip):
    """Adds outbound and inbound block rules in Windows Defender Firewall."""
    try:
        subprocess.run(
            ["netsh", "advfirewall", "firewall", "add", "rule", 
             f"name=Block_IP_{ip}", "dir=in", "action=block", f"remoteip={ip}"],
            capture_output=True, text=True, check=True
        )
        subprocess.run(
            ["netsh", "advfirewall", "firewall", "add", "rule", 
             f"name=Block_IP_{ip}", "dir=out", "action=block", f"remoteip={ip}"],
            capture_output=True, text=True, check=True
        )
        return True
    except Exception as e:
        print(f"Firewall Block Failed: {str(e)}")
        return False

def remove_ip_firewall(ip):
    """Removes firewall rules matching the IP."""
    try:
        subprocess.run(
            ["netsh", "advfirewall", "firewall", "delete", "rule", f"name=Block_IP_{ip}"],
            capture_output=True, text=True
        )
        return True
    except Exception:
        return False

def classify_threat_safety(proc_name, path, ip=None):
    """
    Returns ('allow', description) or ('block', description) or ('prompt', description).
    Determines if an intercepted process/connection is safe or malicious.
    """
    proc_name_lower = proc_name.lower()
    path_lower = path.lower() if path else ""
    
    # Check manual blacklists/whitelists first
    with rules_lock:
        if ip and ip in rules["blocked_ips"]:
            return 'block', "Blocked IP matches user blocklist."
        if proc_name_lower in rules["blocked_processes"]:
            return 'block', "Blocked process matches user blocklist."
        if ip and ip in rules["allowed_ips"]:
            return 'allow', "Allowed IP matches user whitelist."
        if proc_name_lower in rules["allowed_processes"]:
            return 'allow', "Allowed process matches user whitelist."
            
    # Check known Remote Access Tools (RATs)
    from security_audit import RAT_PROCESSES
    if proc_name_lower in RAT_PROCESSES:
        return 'block', f"Blocked active Remote Access Tool ({RAT_PROCESSES[proc_name_lower]})."
        
    # Check common browsers & system items (Safe)
    if proc_name_lower in ["chrome.exe", "msedge.exe", "firefox.exe", "explorer.exe"]:
        return 'allow', "Allowed trusted system application."
        
    # Check if executing from temp or downloads directory making external connections (Threat)
    is_suspicious_path = False
    for susp_dir in ["\\temp\\", "\\appdata\\local\\temp\\", "\\downloads\\"]:
        if susp_dir in path_lower:
            is_suspicious_path = True
            break
            
    if is_suspicious_path:
        if ip:
            return 'block', f"Blocked connection from suspicious path ({os.path.basename(path)} to {ip})."
        return 'block', f"Blocked program launch from suspicious folder ({os.path.basename(path)})."
        
    # Scripts running from User directory (e.g. node, python) connecting to internet (Suspicious)
    if proc_name_lower in ["node.exe", "node_repl.exe", "python.exe", "powershell.exe", "cmd.exe"]:
        if ip:
            # Block outgoing script requests from user context as precaution in Auto-Pilot
            return 'block', f"Blocked scripting host network access ({proc_name} accessing {ip})."
            
    # Default fallback
    return 'prompt', "Ambiguous action. Manual decision required."

def connection_monitor_loop():
    """Polls connections to detect new external established connections."""
    print("Connection Monitor thread started.")
    known_connections = set()
    
    try:
        for conn in psutil.net_connections(kind='inet'):
            if conn.status == 'ESTABLISHED' and conn.raddr:
                known_connections.add((conn.pid, conn.raddr.ip, conn.raddr.port))
    except Exception:
        pass

    while True:
        try:
            time.sleep(1.2)
            current_connections = psutil.net_connections(kind='inet')
            
            for conn in current_connections:
                if conn.status == 'ESTABLISHED' and conn.raddr:
                    ip = conn.raddr.ip
                    port = conn.raddr.port
                    pid = conn.pid
                    
                    if is_private_ip(ip):
                        continue
                        
                    conn_key = (pid, ip, port)
                    if conn_key not in known_connections:
                        known_connections.add(conn_key)
                        
                        proc_name = "Unknown"
                        proc_path = "Unknown"
                        if pid:
                            try:
                                p = psutil.Process(pid)
                                proc_name = p.name()
                                proc_path = p.exe()
                            except Exception:
                                pass
                                
                        if is_safe_process(proc_name, proc_path):
                            continue
                                
                        explanation = explain_process(proc_name, proc_path, ip, port)
                        
                        # Decide Mode
                        global auto_mode
                        if auto_mode:
                            # Auto-Pilot Decision
                            decision, reason = classify_threat_safety(proc_name, proc_path, ip)
                            if decision == 'block':
                                if pid:
                                    try:
                                        p = psutil.Process(pid)
                                        p.kill()
                                    except Exception:
                                        pass
                                with rules_lock:
                                    if ip not in rules["blocked_ips"]:
                                        rules["blocked_ips"].append(ip)
                                        block_ip_firewall(ip)
                                save_rules()
                                log_event("connection", proc_name, f"Auto-Blocked: {reason}", "Blocked", explanation)
                            else:
                                # Silently allow or log
                                log_event("connection", proc_name, f"Auto-Allowed: {reason}", "Allowed", explanation)
                        else:
                            # Manual Mode - Alert and Prompt (No suspension to prevent freezes)
                            suspended = False
                                    
                            alert_data = {
                                "type": "connection",
                                "pid": pid,
                                "process_name": proc_name,
                                "process_path": proc_path,
                                "remote_ip": ip,
                                "remote_port": port,
                                "suspended": suspended,
                                "explanation": explanation
                            }
                            alert_queue.put(alert_data)
                            log_event("connection", proc_name, f"Connection to {ip}:{port} (PID: {pid})", "Alerted", explanation)
        except Exception as e:
            time.sleep(2)

def process_monitor_loop():
    """Polls process list to capture newly spawned processes."""
    print("Process Monitor thread started.")
    seen_pids = set()
    
    try:
        seen_pids.update(p.pid for p in psutil.process_iter())
    except Exception:
        pass
        
    while True:
        try:
            time.sleep(1.0)
            current_pids = set()
            for p in psutil.process_iter():
                current_pids.add(p.pid)
                
            new_pids = current_pids - seen_pids
            for pid in new_pids:
                seen_pids.add(pid)
                
                try:
                    p = psutil.Process(pid)
                    proc_name = p.name()
                    proc_path = p.exe()
                    
                    if is_safe_process(proc_name, proc_path):
                        continue
                    
                    global auto_mode
                    if auto_mode:
                        decision, reason = classify_threat_safety(proc_name, proc_path, None)
                        if decision == 'block':
                            p.kill()
                            with rules_lock:
                                proc_lower = proc_name.lower()
                                if proc_lower not in rules["blocked_processes"]:
                                    rules["blocked_processes"].append(proc_lower)
                            save_rules()
                            explanation = explain_process(proc_name, proc_path, None, None)
                            log_event("process", proc_name, f"Auto-Blocked: {reason}", "Blocked", explanation)
                    else:
                        # Manual Mode check for RAT or Suspicious Path
                        from security_audit import RAT_PROCESSES
                        is_rat = proc_name.lower() in RAT_PROCESSES
                        
                        is_suspicious_path = False
                        for susp_dir in ["\\temp\\", "\\appdata\\local\\temp\\", "\\downloads\\"]:
                            if susp_dir in proc_path.lower():
                                is_suspicious_path = True
                                break
                                
                        if is_rat or is_suspicious_path:
                            # Alert and Prompt (No suspension to prevent freezes)
                            suspended = False
                                
                            explanation = explain_process(proc_name, proc_path, None, None)
                            alert_data = {
                                "type": "process",
                                "pid": pid,
                                "process_name": proc_name,
                                "process_path": proc_path,
                                "is_rat": is_rat,
                                "suspended": suspended,
                                "explanation": explanation
                            }
                            alert_queue.put(alert_data)
                            log_event("process", proc_name, f"Suspicious startup (PID: {pid})", "Alerted", explanation)
                            
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue
            
            seen_pids &= current_pids
            
        except Exception as e:
            time.sleep(2)

# =====================================================================
# UI Notification (Tkinter Popups)
# =====================================================================

def create_alert_ui(alert_data):
    """Creates a beautiful slide-up Tkinter UI at the bottom-right corner."""
    global active_alert
    
    with active_alert_lock:
        if active_alert is not None:
            alert_queue.put(alert_data)
            return

    popup = tk.Toplevel()
    popup.title("Security Alert")
    popup.attributes("-topmost", True)
    popup.overrideredirect(True)
    
    BG_COLOR = "#080c16"
    BORDER_COLOR = "#0ea5e9"
    TEXT_COLOR = "#f1f5f9"
    WARNING_COLOR = "#ef4444"
    ACCENT_GREEN = "#10b981"
    
    popup.configure(background=BORDER_COLOR)
    
    inner_frame = tk.Frame(popup, bg=BG_COLOR, padx=14, pady=14)
    inner_frame.pack(fill=tk.BOTH, expand=True, padx=1, pady=1)
    
    header_frame = tk.Frame(inner_frame, bg=BG_COLOR)
    header_frame.pack(fill=tk.X, pady=(0, 6))
    
    title_text = "⚠ SECURITY INTERCEPT"
    if alert_data.get("is_rat"):
        title_text = "🚨 REMOTE ACCESS ATTACK RISK"
        
    title_lbl = tk.Label(header_frame, text=title_text, bg=BG_COLOR, fg=WARNING_COLOR, font=("Segoe UI", 9, "bold"))
    title_lbl.pack(side=tk.LEFT)
    
    explanation_text = alert_data.get("explanation", "A program is executing a network action.")
    
    desc_lbl = tk.Label(inner_frame, text=explanation_text, bg=BG_COLOR, fg=TEXT_COLOR, font=("Segoe UI", 10, "bold"), wraplength=320, justify="left")
    desc_lbl.pack(anchor="w", pady=(4, 10))
    
    tech_frame = tk.Frame(inner_frame, bg="#0d1527", padx=10, pady=8, highlightbackground="#1e293b", highlightthickness=1)
    
    proc_name = alert_data["process_name"]
    pid = alert_data["pid"]
    proc_path = alert_data["process_path"]
    
    tk.Label(tech_frame, text=f"Executable: {proc_name} (PID: {pid})", bg="#0d1527", fg="#38bdf8", font=("Consolas", 8, "bold")).pack(anchor="w")
    
    path_lbl = tk.Label(tech_frame, text=f"Folder: {proc_path}", bg="#0d1527", fg="#94a3b8", font=("Consolas", 8), wraplength=300, justify="left")
    path_lbl.pack(anchor="w", pady=(2, 4))
    
    if alert_data["type"] == "connection":
        ip = alert_data["remote_ip"]
        port = alert_data["remote_port"]
        tk.Label(tech_frame, text=f"Network Socket: {ip}:{port}", bg="#0d1527", fg="#f43f5e", font=("Consolas", 8, "bold")).pack(anchor="w")
    else:
        tk.Label(tech_frame, text="Reason: Executed from temp/downloads directory", bg="#0d1527", fg="#fbbf24", font=("Consolas", 8)).pack(anchor="w")
    
    expanded = False
    width = 360
    collapsed_height = 175
    expanded_height = 265
    
    def toggle_tech_details():
        nonlocal expanded
        if not expanded:
            popup.geometry(f"{width}x{expanded_height}")
            tech_frame.pack(fill=tk.BOTH, expand=True, before=btn_frame, pady=(0, 10))
            tech_btn.configure(text="Hide Tech Details [-]", bg="#1e293b", fg="#e2e8f0")
            expanded = True
        else:
            tech_frame.pack_forget()
            popup.geometry(f"{width}x{collapsed_height}")
            tech_btn.configure(text="Show Tech Details [?]", bg="#0f172a", fg="#38bdf8")
            expanded = False
            
    tech_btn = tk.Button(inner_frame, text="Show Tech Details [?]", bg="#0f172a", fg="#38bdf8", activebackground="#1e293b", activeforeground="white", font=("Segoe UI", 8, "bold"), bd=0, padx=8, pady=3, cursor="hand2", command=toggle_tech_details)
    tech_btn.pack(anchor="w", pady=(0, 12))
    
    def on_allow():
        global active_alert
        with rules_lock:
            if alert_data["type"] == "connection":
                rules["allowed_ips"].append(alert_data["remote_ip"])
            else:
                rules["allowed_processes"].append(proc_name.lower())
        save_rules()
        log_event(alert_data["type"], proc_name, f"User allowed activity", "Allowed", explanation_text)
        with active_alert_lock:
            active_alert = None
        popup.destroy()

    def on_block():
        global active_alert
        if pid:
            try:
                p = psutil.Process(pid)
                p.kill()
            except Exception:
                pass
        with rules_lock:
            if alert_data["type"] == "connection":
                rules["blocked_ips"].append(alert_data["remote_ip"])
                block_ip_firewall(alert_data["remote_ip"])
            else:
                rules["blocked_processes"].append(proc_name.lower())
        save_rules()
        log_event(alert_data["type"], proc_name, f"User blocked and terminated activity", "Blocked", explanation_text)
        with active_alert_lock:
            active_alert = None
        popup.destroy()

    btn_frame = tk.Frame(inner_frame, bg=BG_COLOR)
    btn_frame.pack(fill=tk.X, side=tk.BOTTOM)
    
    allow_btn = tk.Button(btn_frame, text="Allow Program", bg=ACCENT_GREEN, fg="white", activebackground="#059669", activeforeground="white", font=("Segoe UI", 9, "bold"), bd=0, padx=12, pady=5, cursor="hand2", command=on_allow)
    allow_btn.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0, 6))
    
    block_btn = tk.Button(btn_frame, text="Block & Terminate", bg=WARNING_COLOR, fg="white", activebackground="#dc2626", activeforeground="white", font=("Segoe UI", 9, "bold"), bd=0, padx=12, pady=5, cursor="hand2", command=on_block)
    block_btn.pack(side=tk.RIGHT, expand=True, fill=tk.X, padx=(6, 0))
    
    # Hover bounds
    def on_enter_allow(e): allow_btn.configure(bg="#059669")
    def on_leave_allow(e): allow_btn.configure(bg=ACCENT_GREEN)
    allow_btn.bind("<Enter>", on_enter_allow)
    allow_btn.bind("<Leave>", on_leave_allow)
    
    def on_enter_block(e): block_btn.configure(bg="#b91c1c")
    def on_leave_block(e): block_btn.configure(bg=WARNING_COLOR)
    block_btn.bind("<Enter>", on_enter_block)
    block_btn.bind("<Leave>", on_leave_block)
    
    screen_width = popup.winfo_screenwidth()
    screen_height = popup.winfo_screenheight()
    x = screen_width - width - 20
    start_y = screen_height
    target_y = screen_height - collapsed_height - 60
    popup.geometry(f"{width}x{collapsed_height}+{x}+{start_y}")
    
    with active_alert_lock:
        active_alert = popup
        
    def animate_slide(curr_y):
        if curr_y > target_y:
            curr_y -= 8
            if curr_y < target_y:
                curr_y = target_y
            popup.geometry(f"+{x}+{curr_y}")
            popup.after(10, lambda: animate_slide(curr_y))
            
    animate_slide(start_y)

def queue_checker_loop(root):
    try:
        while True:
            alert_data = alert_queue.get_nowait()
            create_alert_ui(alert_data)
    except queue.Empty:
        pass
    root.after(200, lambda: queue_checker_loop(root))

# =====================================================================
# REST API Server
# =====================================================================

class APIServerHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        return
        
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        
        if self.path == "/api/status":
            global auto_mode
            self.wfile.write(json.dumps({
                "status": "active", 
                "monitoring": True, 
                "auto_mode": auto_mode
            }).encode())
            
        elif self.path == "/api/connections":
            from security_audit import check_established_connections
            conns = check_established_connections()
            for conn in conns:
                conn["explanation"] = explain_process(conn["process_name"], conn["process_path"], conn["remote_ip"], conn["remote_port"])
            self.wfile.write(json.dumps(conns).encode())
            
        elif self.path == "/api/logs":
            with logs_lock:
                self.wfile.write(json.dumps(security_logs).encode())
                
        elif self.path == "/api/rules":
            with rules_lock:
                self.wfile.write(json.dumps(rules).encode())
                
        elif self.path == "/api/audit":
            from security_audit import run_audit
            report = run_audit()
            if "active_rats" in report:
                for rat in report["active_rats"]:
                    rat["explanation"] = explain_process(rat["name"], rat["path"], None, None)
            self.wfile.write(json.dumps(report).encode())
            
        else:
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode())

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode())
        
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        
        if self.path == "/api/toggle_auto_mode":
            global auto_mode
            with auto_mode_lock:
                auto_mode = not auto_mode
                current_mode = auto_mode
            log_event("audit", "System", f"Auto-Pilot Mode toggled to {current_mode}", "Toggle", f"Toggled Auto-Pilot mode to {current_mode}.")
            self.wfile.write(json.dumps({"success": True, "auto_mode": current_mode}).encode())
            
        elif self.path == "/api/block":
            block_type = body.get("type")
            target = body.get("target")
            
            with rules_lock:
                if block_type == "ip":
                    if target not in rules["blocked_ips"]:
                        rules["blocked_ips"].append(target)
                        block_ip_firewall(target)
                        log_event("connection", target, "Manually blocked IP and added firewall rule", "Blocked", f"Manually blocked IP address {target}.")
                elif block_type == "process":
                    target_lower = target.lower()
                    if target_lower not in rules["blocked_processes"]:
                        rules["blocked_processes"].append(target_lower)
                        for proc in psutil.process_iter():
                            try:
                                if proc.name().lower() == target_lower:
                                    proc.kill()
                            except Exception:
                                pass
                        log_event("process", target, "Manually blocked process and terminated instances", "Blocked", f"Manually blocked process '{target}' from running.")
            save_rules()
            self.wfile.write(json.dumps({"success": True}).encode())
            
        elif self.path == "/api/allow":
            allow_type = body.get("type")
            target = body.get("target")
            
            with rules_lock:
                if allow_type == "ip":
                    if target in rules["blocked_ips"]:
                        rules["blocked_ips"].remove(target)
                        remove_ip_firewall(target)
                    if target not in rules["allowed_ips"]:
                        rules["allowed_ips"].append(target)
                    log_event("connection", target, "Manually allowed IP", "Allowed", f"Allowed connections to IP address {target}.")
                elif allow_type == "process":
                    target_lower = target.lower()
                    if target_lower in rules["blocked_processes"]:
                        rules["blocked_processes"].remove(target_lower)
                    if target_lower not in rules["allowed_processes"]:
                        rules["allowed_processes"].append(target_lower)
                    log_event("process", target, "Manually allowed process", "Allowed", f"Allowed program '{target}' to run on computer.")
            save_rules()
            self.wfile.write(json.dumps({"success": True}).encode())
            
        elif self.path == "/api/clear_rules":
            with rules_lock:
                for ip in rules["blocked_ips"]:
                    remove_ip_firewall(ip)
                rules.update({
                    "blocked_ips": [],
                    "blocked_processes": [],
                    "allowed_ips": [],
                    "allowed_processes": []
                })
            save_rules()
            log_event("audit", "System", "Cleared all block/allow security rules", "Reset", "All security block/allow rules reset.")
            self.wfile.write(json.dumps({"success": True}).encode())
            
        else:
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode())

def run_api_server():
    server = HTTPServer(("127.0.0.1", API_PORT), APIServerHandler)
    print(f"API Server listening on http://127.0.0.1:{API_PORT}")
    server.serve_forever()

# =====================================================================
# System Tray Application Setup
# =====================================================================

def create_tray_image():
    image = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    dc = ImageDraw.Draw(image)
    
    dc.polygon([(32, 4), (56, 16), (56, 40), (32, 60), (8, 40), (8, 16)], 
               fill=(34, 211, 238, 255), outline=(14, 165, 233, 255))
    dc.polygon([(32, 12), (48, 20), (48, 38), (32, 52), (16, 38), (16, 20)], 
               fill=(30, 58, 95, 255))
    dc.line([(24, 32), (30, 38), (42, 24)], fill=(34, 211, 238, 255), width=3)
    return image

def open_dashboard():
    import webbrowser
    webbrowser.open("http://localhost:5174")

def toggle_auto_mode_tray(icon, item):
    global auto_mode
    with auto_mode_lock:
        auto_mode = not auto_mode
        current_mode = auto_mode
    log_event("audit", "System", f"Auto-Pilot Mode toggled to {current_mode} via System Tray", "Toggle", f"Toggled Auto-Pilot mode to {current_mode}.")

def run_tray_icon(icon):
    icon.run()

if __name__ == "__main__":
    print("Initializing PC Security Monitor Agent...")
    
    # 1. Start background API server
    api_thread = threading.Thread(target=run_api_server)
    api_thread.daemon = True
    api_thread.start()
    
    # 2. Start connection and process monitoring threads
    conn_thread = threading.Thread(target=connection_monitor_loop)
    conn_thread.daemon = True
    conn_thread.start()
    
    proc_thread = threading.Thread(target=process_monitor_loop)
    proc_thread.daemon = True
    proc_thread.start()
    
    # 3. Create System Tray Icon
    icon = pystray.Icon("security_monitor", create_tray_image(), "PC Security Monitor")
    icon.menu = pystray.Menu(
        pystray.MenuItem("Open Dashboard", open_dashboard),
        pystray.MenuItem("Auto-Pilot Mode", toggle_auto_mode_tray, checked=lambda item: auto_mode),
        pystray.MenuItem("Exit", lambda: os._exit(0))
    )
    
    tray_thread = threading.Thread(target=run_tray_icon, args=(icon,))
    tray_thread.daemon = True
    tray_thread.start()
    
    # 4. Run Tkinter Main loop
    root = tk.Tk()
    root.withdraw()
    
    root.after(200, lambda: queue_checker_loop(root))
    
    log_event("audit", "Agent", "Security Agent initialized and monitoring system.", "Active", "Tray agent active and monitoring laptop security.")
    
    root.mainloop()
