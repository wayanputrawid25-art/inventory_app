Push workflow using the local SSH key

1) Add the public key to GitHub
   - Copy the contents of `C:\Users\user\.ssh\inventory_app_id_ed25519.pub`
   - In GitHub: Settings → SSH and GPG keys → New SSH key → paste and save

2) Push using the helper script (no ssh-agent required)
   - From PowerShell in the repo root:

```powershell
.\scripts\push_with_key.ps1 -Branch ui/dashboard-redesign -KeyPath "$env:USERPROFILE\.ssh\inventory_app_id_ed25519"
```

3) Alternative approaches
   - Use `gh auth login` and push normally.
   - Start the Windows `ssh-agent` service and `ssh-add` the key.

Notes
- The helper script sets `GIT_SSH_COMMAND` temporarily so the chosen key is used only for the current process.
- Do not commit your private key into the repo.
