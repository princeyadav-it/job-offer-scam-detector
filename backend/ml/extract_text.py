"""
Text Extraction from PDF and Images
Extracts text from uploaded offer letter files (PDF, JPG, PNG)
"""

import sys
import os

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF file using PyPDF2"""
    try:
        import PyPDF2
        
        text = ""
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        
        return text if text.strip() else None
    except Exception as e:
        print(f"PyPDF2 error: {e}", file=sys.stderr)
        return None


def extract_text_from_image(image_path):
    """Extract text from image using OCR (pytesseract)"""
    try:
        from PIL import Image
        import pytesseract
        
        # Open the image
        img = Image.open(image_path)
        
        # Extract text using OCR
        text = pytesseract.image_to_string(img)
        
        return text if text.strip() else None
    except Exception as e:
        print(f"OCR error: {e}", file=sys.stderr)
        return None


def extract_text(file_path):
    """Main function to extract text based on file type"""
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}
    
    ext = os.path.splitext(file_path)[1].lower()
    
    text = None
    
    if ext == '.pdf':
        text = extract_text_from_pdf(file_path)
    elif ext in ['.jpg', '.jpeg', '.png']:
        text = extract_text_from_image(file_path)
    else:
        return {"error": f"Unsupported file type: {ext}"}
    
    if text and text.strip():
        return {"success": True, "text": text}
    else:
        return {"error": "Could not extract text from file"}


if __name__ == "__main__":
    # Get file path from command line argument
    if len(sys.argv) < 2:
        print("Usage: python extract_text.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    result = extract_text(file_path)
    
    # Output as JSON for Node.js to parse
    import json
    print(json.dumps(result))
