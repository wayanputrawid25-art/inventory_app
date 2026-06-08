Param(
    [string]$Branch = "ui/dashboard-redesign",
    [string]$KeyPath = "$env:USERPROFILE\.ssh\inventory_app_id_ed25519"
)

Write-Host "Using SSH key: $KeyPath"

# Set temporary GIT_SSH_COMMAND to use the specific private key for this process
$env:GIT_SSH_COMMAND = "ssh -i $KeyPath -o IdentitiesOnly=yes -o StrictHostKeyChecking=no"

Write-Host "Ensuring remote is the SSH url..."
git remote set-url origin git@github.com:CV-EPIC/inventory_app.git

Write-Host "Fetching origin..."
git fetch origin

Write-Host "Pushing branch $Branch to origin..."
git push -u origin $Branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "Push succeeded."
} else {
    Write-Host "Push failed with exit code $LASTEXITCODE" -ForegroundColor Red
}
