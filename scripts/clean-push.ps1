param(
  [string]$RepoUrl = "https://github.com/nhanbin2024/snake-on-arc.git"
)

Write-Host "Cleaning build/cache/system folders..."
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force artifacts -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force typechain-types -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .fly -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force AppData -ErrorAction SilentlyContinue

Write-Host "Reinitializing Git..."
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
git init
git add .
git commit -m "Initial clean commit: Snake on Arc"
git branch -M main
git remote add origin $RepoUrl
git push -u origin main --force
