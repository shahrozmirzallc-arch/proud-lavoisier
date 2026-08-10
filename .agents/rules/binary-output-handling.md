# Binary Output Handling

This is an always-on safety rule for every agent working in this workspace.

- Never call `view_file`, create an artifact preview, attach for display, or open an internal Antigravity/IDE tab for non-displayable binary, package, or archive outputs, including `.apk`, `.aab`, `.ipa`, `.zip`, `.7z`, `.rar`, `.exe`, `.msi`, and `.jar` files.
- After generating or locating one of these files on Windows, verify that the file exists and reveal the existing file in Windows File Explorer with `explorer.exe /select,"<absolute_file_path>"`.
- If selecting the file is unavailable, open only its containing directory and report the full absolute file path in chat.
- Never copy a large binary into a conversation artifact directory merely to display it.
- Apply this rule to the primary agent and every subagent.

