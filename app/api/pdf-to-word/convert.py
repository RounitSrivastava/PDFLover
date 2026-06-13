import sys
from pdf2docx import Converter

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python convert.py <input_pdf> <output_docx>")
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    docx_path = sys.argv[2]
    
    try:
        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()
        print("Success")
    except Exception as e:
        print(f"Error during conversion: {e}", file=sys.stderr)
        sys.exit(1)
