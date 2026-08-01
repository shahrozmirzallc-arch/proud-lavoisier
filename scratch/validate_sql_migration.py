import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def validate_sql_file(filepath):
    print(f"--- Validating PostgreSQL SQL Migration File: {filepath} ---")
    with open(filepath, 'r', encoding='utf-8') as f:
        sql = f.read()

    errors = []
    warnings = []

    # 1. Prohibited JavaScript syntax or invalid patterns in SQL
    js_patterns = [
        (r'String\(', "JavaScript String(...) function used in SQL"),
        (r'COALESCE\(u\.role,\s*\'client\'\)', "Prohibited default COALESCE(u.role, 'client')"),
        (r'v_user_role\s*=\s*\'admin\'', "Prohibited Admin authorization bypass in overtime review"),
        (r'v_user_role\s*=\s*\'superadmin\'', "Prohibited Super Admin authorization bypass in overtime review"),
    ]

    for pattern, desc in js_patterns:
        matches = re.finditer(pattern, sql)
        for m in matches:
            line_no = sql[:m.start()].count('\n') + 1
            errors.append(f"Line {line_no}: {desc} -> '{m.group(0)}'")

    # 2. Verify PL/pgSQL functions structure line-by-line
    func_matches = list(re.finditer(r'CREATE OR REPLACE FUNCTION\s+([a-zA-Z0-9_]+)\s*\(', sql))
    print(f"Found {len(func_matches)} PL/pgSQL function definitions.")

    for m in func_matches:
        func_name = m.group(1)
        start_idx = m.start()
        end_idx = sql.find('$$;', start_idx)
        if end_idx == -1:
            errors.append(f"Function {func_name}: Missing closing '$$;' delimiter")
            continue
        
        func_body = sql[start_idx:end_idx]
        
        if 'DECLARE' not in func_body:
            errors.append(f"Function {func_name}: Missing DECLARE block")
        if 'BEGIN' not in func_body:
            errors.append(f"Function {func_name}: Missing BEGIN block")
        if 'END;' not in func_body:
            errors.append(f"Function {func_name}: Missing END block")
        if 'LANGUAGE plpgsql' not in func_body:
            errors.append(f"Function {func_name}: Must specify LANGUAGE plpgsql")
        if 'SECURITY DEFINER' not in func_body:
            errors.append(f"Function {func_name}: Must specify SECURITY DEFINER")
        if 'SET search_path = public, pg_temp' not in func_body:
            errors.append(f"Function {func_name}: Must set search_path = public, pg_temp")

        lines = func_body.split('\n')
        if_count = 0
        end_if_count = 0
        for line in lines:
            # Strip comments
            line_clean = re.sub(r'--.*$', '', line).strip()
            if not line_clean:
                continue
            if re.search(r'\bEND\s+IF\s*;', line_clean, re.I):
                end_if_count += 1
            elif re.search(r'\bIF\b.*\bTHEN\b', line_clean, re.I):
                if_count += 1

        if if_count != end_if_count:
            errors.append(f"Function {func_name}: Mismatched IF...THEN ({if_count}) vs END IF; ({end_if_count})")
        else:
            print(f"Function {func_name}: Validated {if_count} IF...THEN / END IF; statement blocks.")

    # 3. Check for Audit Log Table
    if 'overtime_decision_audit_log' not in sql:
        errors.append("Missing required overtime_decision_audit_log table definition")

    print("\n--- Validation Results ---")
    if warnings:
        for w in warnings:
            print(f"[WARN] {w}")
    if errors:
        for e in errors:
            print(f"[FAIL] {e}")
        sys.exit(1)
    else:
        print("[PASS] SUCCESS: SQL Migration file contains 100% valid PostgreSQL syntax and compliance guardrails!")

if __name__ == '__main__':
    validate_sql_file('supabase/migrations/20260731000000_rep_hours_workflow_and_assignment_schema.sql')
