# GestivaPost Custom Rules

- **Git Auto-Commit:** Al finalizar una tarea o resolver un bug, el agente siempre debe hacer commit y push de los cambios al repositorio automáticamente sin pedir confirmación.
- **Git Executable Path:** Ya que `git` no está en el PATH por defecto de Powershell, siempre debes ejecutar los comandos usando la ruta absoluta: `& "C:\Program Files\Git\cmd\git.exe"`.
  - Ejemplo de comando: `& "C:\Program Files\Git\cmd\git.exe" add . ; & "C:\Program Files\Git\cmd\git.exe" commit -m "mensaje" ; & "C:\Program Files\Git\cmd\git.exe" push`
