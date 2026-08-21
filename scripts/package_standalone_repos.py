import os
import shutil
import subprocess
from pathlib import Path

BASE_DIR = Path("D:/Projects/Paperwork")
STANDALONE_DIR = BASE_DIR / "standalone_repos"
STANDALONE_DIR.mkdir(exist_ok=True)

# Common gitignore content
GITIGNORE = """__pycache__/
*.py[cod]
*$py.class
.env
.venv/
env/
venv/
*.log
.pytest_cache/
"""

import stat

def remove_readonly(func, path, excinfo):
    os.chmod(path, stat.S_IWRITE)
    func(path)

def clean_dir(d: Path):
    if d.exists():
        shutil.rmtree(d, onerror=remove_readonly)
    d.mkdir(parents=True, exist_ok=True)

def init_git_repo(repo_path: Path, repo_name: str, commit_msg: str):
    subprocess.run(["git", "init"], cwd=repo_path, check=True)
    subprocess.run(["git", "branch", "-M", "main"], cwd=repo_path, check=True)
    subprocess.run(["git", "add", "."], cwd=repo_path, check=True)
    subprocess.run(["git", "commit", "-m", commit_msg], cwd=repo_path, check=True)
    remote_url = f"https://github.com/suvrajjit/{repo_name}.git"
    subprocess.run(["git", "remote", "add", "origin", remote_url], cwd=repo_path, check=False)
    print(f"[OK] Initialized git repo at {repo_path} with remote {remote_url}")

# -------------------------------------------------------------
# 1. MODULE 1: Document Intelligence
# -------------------------------------------------------------
m1_dir = STANDALONE_DIR / "module-1-document-intelligence"
clean_dir(m1_dir)

# Copy module core
shutil.copy(BASE_DIR / "backend/modules/document_intelligence/extractor.py", m1_dir / "extractor.py")
shutil.copy(BASE_DIR / "backend/modules/document_intelligence/app.py", m1_dir / "app.py")
shutil.copy(BASE_DIR / "backend/modules/document_intelligence/requirements.txt", m1_dir / "requirements.txt")
shutil.copy(BASE_DIR / "backend/modules/document_intelligence/README.md", m1_dir / "README.md")
shutil.copy(BASE_DIR / "backend/modules/document_intelligence/.env.example", m1_dir / ".env.example")
(m1_dir / ".gitignore").write_text(GITIGNORE, encoding="utf-8")

# Copy supporting service files needed for standalone execution
services_dir = m1_dir / "services"
services_dir.mkdir()
shutil.copy(BASE_DIR / "backend/app/services/ai/groq.py", services_dir / "groq.py")
shutil.copy(BASE_DIR / "backend/app/services/ai/gemini_service.py", services_dir / "gemini_service.py")
shutil.copy(BASE_DIR / "backend/app/services/ocr/document_parser.py", services_dir / "document_parser.py")
(services_dir / "__init__.py").touch()

schemas_dir = m1_dir / "schemas"
schemas_dir.mkdir()
shutil.copy(BASE_DIR / "backend/app/schemas/document_schemas.py", schemas_dir / "document_schemas.py")
(schemas_dir / "__init__.py").touch()

data_dir = m1_dir / "data"
data_dir.mkdir()
shutil.copy(BASE_DIR / "backend/app/data/synthetic_documents.py", data_dir / "synthetic_documents.py")
(data_dir / "__init__.py").touch()

# Copy sample synthetic pdf
if (BASE_DIR / "backend/gold-loan-applaction-formcum-agreement.pdf").exists():
    shutil.copy(BASE_DIR / "backend/gold-loan-applaction-formcum-agreement.pdf", m1_dir / "sample_form.pdf")

init_git_repo(m1_dir, "PlanBDocumentIntelligence", "feat: standalone Document Intelligence OCR extraction microservice")

# -------------------------------------------------------------
# 2. MODULE 2: Eligibility Copilot
# -------------------------------------------------------------
m2_dir = STANDALONE_DIR / "module-2-eligibility-copilot"
clean_dir(m2_dir)

shutil.copy(BASE_DIR / "backend/modules/eligibility_copilot/evaluator.py", m2_dir / "evaluator.py")
shutil.copy(BASE_DIR / "backend/modules/eligibility_copilot/app.py", m2_dir / "app.py")
shutil.copy(BASE_DIR / "backend/modules/eligibility_copilot/requirements.txt", m2_dir / "requirements.txt")
shutil.copy(BASE_DIR / "backend/modules/eligibility_copilot/README.md", m2_dir / "README.md")
shutil.copy(BASE_DIR / "backend/modules/eligibility_copilot/.env.example", m2_dir / ".env.example")
(m2_dir / ".gitignore").write_text(GITIGNORE, encoding="utf-8")

m2_rules = m2_dir / "rules"
m2_rules.mkdir()
shutil.copy(BASE_DIR / "backend/app/rules/schemes.json", m2_rules / "schemes.json")

m2_services = m2_dir / "services"
m2_services.mkdir()
shutil.copy(BASE_DIR / "backend/app/services/ai/groq.py", m2_services / "groq.py")
shutil.copy(BASE_DIR / "backend/app/services/ai/gemini_service.py", m2_services / "gemini_service.py")
(m2_services / "__init__.py").touch()

init_git_repo(m2_dir, "PlanBEligibilityCopilot", "feat: standalone deterministic Eligibility Copilot rule engine microservice")

# -------------------------------------------------------------
# 3. MODULE 3: Form Readiness Kit
# -------------------------------------------------------------
m3_dir = STANDALONE_DIR / "module-3-form-readiness-kit"
clean_dir(m3_dir)

shutil.copy(BASE_DIR / "backend/modules/form_readiness_kit/preparer.py", m3_dir / "preparer.py")
shutil.copy(BASE_DIR / "backend/modules/form_readiness_kit/app.py", m3_dir / "app.py")
shutil.copy(BASE_DIR / "backend/modules/form_readiness_kit/requirements.txt", m3_dir / "requirements.txt")
shutil.copy(BASE_DIR / "backend/modules/form_readiness_kit/README.md", m3_dir / "README.md")
shutil.copy(BASE_DIR / "backend/modules/form_readiness_kit/.env.example", m3_dir / ".env.example")
(m3_dir / ".gitignore").write_text(GITIGNORE, encoding="utf-8")

m3_rules = m3_dir / "rules"
m3_rules.mkdir()
shutil.copy(BASE_DIR / "backend/app/rules/sample_forms.json", m3_rules / "sample_forms.json")

m3_services = m3_dir / "services"
m3_services.mkdir()
shutil.copy(BASE_DIR / "backend/app/services/documents/pdf_generator.py", m3_services / "pdf_generator.py")
shutil.copy(BASE_DIR / "backend/app/services/ai/groq.py", m3_services / "groq.py")
(m3_services / "__init__.py").touch()

init_git_repo(m3_dir, "PlanBFormReadinessKit", "feat: standalone Form Readiness Kit & draft PDF generator microservice")

# -------------------------------------------------------------
# 4. MODULE 4: Bilingual Explainer & Voice Agent
# -------------------------------------------------------------
m4_dir = STANDALONE_DIR / "module-4-bilingual-explainer"
clean_dir(m4_dir)

shutil.copy(BASE_DIR / "backend/modules/bilingual_explainer/explainer.py", m4_dir / "explainer.py")
shutil.copy(BASE_DIR / "backend/modules/bilingual_explainer/app.py", m4_dir / "app.py")
shutil.copy(BASE_DIR / "backend/modules/bilingual_explainer/requirements.txt", m4_dir / "requirements.txt")
shutil.copy(BASE_DIR / "backend/modules/bilingual_explainer/README.md", m4_dir / "README.md")
shutil.copy(BASE_DIR / "backend/modules/bilingual_explainer/.env.example", m4_dir / ".env.example")
(m4_dir / ".gitignore").write_text(GITIGNORE, encoding="utf-8")

m4_services = m4_dir / "services"
m4_services.mkdir()
shutil.copy(BASE_DIR / "backend/app/services/ai/groq.py", m4_services / "groq.py")
shutil.copy(BASE_DIR / "backend/app/services/ai/gemini_service.py", m4_services / "gemini_service.py")
(m4_services / "__init__.py").touch()

init_git_repo(m4_dir, "PlanBBilingualExplainer", "feat: standalone Bilingual Explainer & Conversational Voice Agent microservice")

print("\n=== ALL 4 STANDALONE MODULE REPOSITORIES GENERATED SUCCESSFULLY ===")
