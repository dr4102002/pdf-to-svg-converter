import os
import uuid
import fitz  # PyMuPDF
from typing import Optional

def convert_pdf_to_vector(pdf_path: str, output_dir: str) -> Optional[str]:
    """
    Converts the first page of a PDF file to SVG vector format using PyMuPDF.
    Returns the path to the generated SVG file or None if it fails.
    """
    if not os.path.exists(pdf_path):
        return None
        
    base_name = str(uuid.uuid4())
    svg_path = os.path.join(output_dir, f"{base_name}.svg")
    
    try:
        doc = fitz.open(pdf_path)
        if len(doc) == 0:
            return None
            
        page = doc[0]
        # Generate SVG string from the page
        svg_content = page.get_svg_image(matrix=fitz.Identity)
        
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
            
        return svg_path
    except Exception as e:
        print(f"Error converting PDF to SVG: {e}")
        return None
