# smoke_test.py
# Automated Smoke Test Suite for PC Security Monitor
# Designed to verify whitelisting, threat classification, and IP checks.

import os
import sys

# Add workspace directory to path to import security_agent
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import security_agent
    import security_audit
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

def run_test(test_num, description, test_fn):
    """Utility to run a test and print structured results."""
    print(f"Running Test {test_num:02d}: {description}...")
    try:
        success, message = test_fn()
        if success:
            print(f"  [PASS] {message}")
            return True
        else:
            print(f"  [FAIL] {message}")
            return False
    except Exception as e:
        print(f"  [ERROR] Exception raised during test: {e}")
        return False

# =====================================================================
# Smoke Test Case Definitions
# =====================================================================

def test_whitelist_language_server():
    res = security_agent.is_safe_process("language_server.exe", "C:\\Users\\Sharoz\\AppData\\Local\\Programs\\antigravity\\resources\\bin\\language_server.exe")
    if res is True:
        return True, "language_server.exe in antigravity path correctly whitelisted."
    return False, f"Expected True, got {res}."

def test_whitelist_antigravity_path():
    res = security_agent.is_safe_process("helper_tool.exe", "C:\\Users\\Sharoz\\AppData\\Local\\Programs\\antigravity\\helper_tool.exe")
    if res is True:
        return True, "Binaries in 'antigravity' folder correctly whitelisted."
    return False, f"Expected True, got {res}."

def test_whitelist_gemini_path():
    res = security_agent.is_safe_process("config.exe", "C:\\Users\\Sharoz\\.gemini\\antigravity\\config.exe")
    if res is True:
        return True, "Binaries in '.gemini' folder correctly whitelisted."
    return False, f"Expected True, got {res}."

def test_untrusted_anydesk_not_whitelisted():
    res = security_agent.is_safe_process("anydesk.exe", "C:\\Program Files\\AnyDesk\\AnyDesk.exe")
    if res is False:
        return True, "AnyDesk is correctly NOT whitelisted."
    return False, f"Expected False, got {res}."

def test_private_ip_loopback():
    res = security_agent.is_private_ip("127.0.0.1")
    if res is True:
        return True, "Loopback IP 127.0.0.1 correctly classified as private."
    return False, f"Expected True, got {res}."

def test_private_ip_lan():
    res = security_agent.is_private_ip("192.168.1.100")
    if res is True:
        return True, "LAN IP 192.168.1.100 correctly classified as private."
    return False, f"Expected True, got {res}."

def test_public_ip():
    res = security_agent.is_private_ip("8.8.8.8")
    if res is False:
        return True, "Public IP 8.8.8.8 correctly classified as external/public."
    return False, f"Expected False, got {res}."

def test_threat_classification_anydesk():
    decision, reason = security_agent.classify_threat_safety("AnyDesk.exe", "C:\\Program Files\\AnyDesk\\AnyDesk.exe")
    if decision == 'block':
        return True, f"AnyDesk correctly classified as block. Reason: {reason}"
    return False, f"Expected 'block', got '{decision}'."

def test_threat_classification_chrome():
    decision, reason = security_agent.classify_threat_safety("chrome.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
    if decision == 'allow':
        return True, f"Chrome browser in program path correctly classified as allow. Reason: {reason}"
    return False, f"Expected 'allow', got '{decision}'."

def test_explain_process_rat():
    explanation = security_agent.explain_process("anydesk.exe", "C:\\AnyDesk.exe")
    if "Remote" in explanation or "Screen Sharing" in explanation:
        return True, f"AnyDesk correctly explained in simple terms: '{explanation}'"
    return False, f"Explanation did not contain expected warning keywords. Got: '{explanation}'"

# =====================================================================
# Main Test Runner
# =====================================================================

if __name__ == "__main__":
    print("=========================================================")
    print("           PC SECURITY AGENT SMOKE TEST SUITE            ")
    print("=========================================================")
    
    tests = [
        (1, "Verify language_server.exe whitelisting", test_whitelist_language_server),
        (2, "Verify 'antigravity' folder whitelisting", test_whitelist_antigravity_path),
        (3, "Verify '.gemini' folder whitelisting", test_whitelist_gemini_path),
        (4, "Verify AnyDesk is NOT whitelisted", test_untrusted_anydesk_not_whitelisted),
        (5, "Verify loopback IP 127.0.0.1 is private", test_private_ip_loopback),
        (6, "Verify LAN IP 192.168.1.100 is private", test_private_ip_lan),
        (7, "Verify Google DNS IP 8.8.8.8 is public", test_public_ip),
        (8, "Verify threat classification for AnyDesk", test_threat_classification_anydesk),
        (9, "Verify threat classification for Chrome browser", test_threat_classification_chrome),
        (10, "Verify plain-language warning for remote tools", test_explain_process_rat)
    ]
    
    passed_count = 0
    for num, desc, fn in tests:
        if run_test(num, desc, fn):
            passed_count += 1
        print("-" * 57)
        
    print("\n========================= SUMMARY =======================")
    print(f"Total Tests Run: {len(tests)}")
    print(f"Tests Passed:    {passed_count} / {len(tests)}")
    print("=========================================================")
    
    if passed_count == len(tests):
        print("  [SUCCESS] All 10 smoke tests passed successfully!")
        sys.exit(0)
    else:
        print("  [FAILURE] One or more smoke tests failed.")
        sys.exit(1)
