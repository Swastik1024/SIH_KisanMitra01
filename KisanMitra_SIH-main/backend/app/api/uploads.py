from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
import os
import uuid

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

# ✅ Use absolute path so uploads always work
UPLOAD_DIR = os.path.join(os.getcwd(), "storage", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_file(
    request: Request,                     # ✅ added to build full URL
    file: UploadFile = File(...),
    # current_user=Depends(get_current_user),  # ❌ REMOVED – allows uploads during registration
):
    try:
        # Optional validation
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed")

        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in ["jpg", "jpeg", "png", "gif", "webp"]:
            raise HTTPException(status_code=400, detail="Unsupported image format")

        unique_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        url = f"/static/uploads/{unique_name}"
        full_url = f"{request.base_url}{url.lstrip('/')}"   # ✅ returns full URL

        return {"url": full_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")