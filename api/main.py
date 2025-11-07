import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import auth, projects, tasks, payments, calculations, design_bases, structural_calcs

app = FastAPI(title="StructApp API", version="0.1.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])
app.include_router(calculations.router, prefix="/calculations", tags=["calculations"])
app.include_router(design_bases.router, prefix="/design-bases", tags=["design-bases"])
app.include_router(structural_calcs.router, prefix="/structural-calcs", tags=["structural-calcs"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}
