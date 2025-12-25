$pythonPath = py -c "import sys; print(sys.executable)"
$pythonPath = $pythonPath.Trim()
& $pythonPath manage.py $args
