from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import uuid
from converter import convert_pdf_to_vector

app = FastAPI()

# Allow CORS for the frontend Vite server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Generate a unique path for the uploaded PDF
    pdf_filename = f"{uuid.uuid4()}_{file.filename}"
    pdf_path = os.path.join(UPLOAD_DIR, pdf_filename)
    
    # Save the uploaded file
    try:
        with open(pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Convert the PDF to SVG (Vector)
    vector_path = convert_pdf_to_vector(pdf_path, OUTPUT_DIR)
    
    if not vector_path or not os.path.exists(vector_path):
        raise HTTPException(status_code=500, detail="Conversion to Vector failed.")

    # Return the file as a downloadable response
    return FileResponse(
        path=vector_path,
        media_type="image/svg+xml",
        filename=f"{os.path.splitext(file.filename)[0]}.svg"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
