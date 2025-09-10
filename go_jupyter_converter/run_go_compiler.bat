@echo off
cd /d "C:\Users\Albert Nedumudy\Desktop\Main HQ\Work\NNDL_Project\go_jupyter_converter"

REM Run Go and capture its JSON output
go run cmd\go_compiler\main.go --file "%~1"
