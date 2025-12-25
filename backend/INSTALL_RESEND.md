# Instrucciones para Instalar Resend

## Problema
El paquete `resend` necesita ser instalado manualmente porque pip no está accesible desde PowerShell.

## Solución: Instalar desde el entorno virtual de Django

### Paso 1: Encontrar el Python correcto
El servidor Django está corriendo, lo que significa que hay un Python funcionando. Necesitas encontrarlo.

```powershell
# Opción A: Si tienes un entorno virtual
cd D:\source\reposV2026\ecommerce\backend
.\venv\Scripts\python.exe -m pip install resend

# Opción B: Buscar el Python en Program Files
C:\Python39\python.exe -m pip install resend
# o
C:\Python310\python.exe -m pip install resend
# o
C:\Python311\python.exe -m pip install resend

# Opción C: Usar py launcher
py -m pip install resend
```

### Paso 2: Verificar instalación
```powershell
.\django.ps1 shell -c "import resend; print('✓ Resend instalado correctamente')"
```

### Paso 3: Reiniciar servidor Django
1. Detén el servidor actual (Ctrl+C en la terminal donde corre)
2. Inicia nuevamente:
```powershell
.\django.ps1 runserver
```

## Alternativa: Instalar manualmente el archivo wheel

Si ninguna opción funciona, puedes:
1. Descargar resend desde PyPI: https://pypi.org/project/resend/#files
2. Instalar el archivo .whl directamente

## Verificar que funciona

Después de instalar y reiniciar, crea una cotización y verifica que llegue el email a: dosmil487@gmail.com
