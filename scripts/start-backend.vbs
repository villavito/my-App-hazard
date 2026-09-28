' Launches the incident-reporting backend (backend/server.js) completely
' hidden - no console window - so it can run as a login task without
' popping up a terminal every time the user signs in.
Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
' Resolve the repo root relative to this script's own location (scripts\..)
' instead of a hardcoded path, so this still works if the repo is cloned
' elsewhere or run under a different Windows account.
repoRoot = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
WshShell.CurrentDirectory = repoRoot
WshShell.Run "node backend\server.js", 0, False
