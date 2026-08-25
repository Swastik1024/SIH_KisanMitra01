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
        allowed_types = ("image/", "video/")
        if not any(file.content_type.startswith(t) for t in allowed_types):
            raise HTTPException(status_code=400, detail="Only image and video files are allowed")

        file_ext = file.filename.split(".")[-1].lower()
        allowed_exts = ["jpg", "jpeg", "png", "gif", "webp", "mp4", "webm", "mov", "avi", "mkv"]
        if file_ext not in allowed_exts:
            raise HTTPException(status_code=400, detail="Unsupported file format")

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