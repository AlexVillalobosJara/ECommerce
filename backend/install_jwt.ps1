$env = ".\.venv\Scripts\Activate.ps1"
if (Test-Path $env) {
    & $env
    pip install djangorestframework-simplejwt
}
else {
    Write-Host "Virtual environment not found. Installing globally..."
    python -m pip install djangorestframework-simplejwt
}
