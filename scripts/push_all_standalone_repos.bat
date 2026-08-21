@echo off
echo =======================================================
echo Pushing All 4 Standalone Repositories to GitHub...
echo =======================================================

echo.
echo [1/4] Pushing Module 1: Document Intelligence...
cd /d D:\Projects\Paperwork\standalone_repos\module-1-document-intelligence
git push -u origin main

echo.
echo [2/4] Pushing Module 2: Eligibility Copilot...
cd /d D:\Projects\Paperwork\standalone_repos\module-2-eligibility-copilot
git push -u origin main

echo.
echo [3/4] Pushing Module 3: Form Readiness Kit...
cd /d D:\Projects\Paperwork\standalone_repos\module-3-form-readiness-kit
git push -u origin main

echo.
echo [4/4] Pushing Module 4: Bilingual Explainer & Voice...
cd /d D:\Projects\Paperwork\standalone_repos\module-4-bilingual-explainer
git push -u origin main

echo.
echo =======================================================
echo All Done!
echo =======================================================
pause
