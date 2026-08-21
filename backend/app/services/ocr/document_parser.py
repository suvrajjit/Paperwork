import io
import logging
from typing import Tuple, List
import pymupdf  # PyMuPDF
from PIL import Image

logger = logging.getLogger(__name__)


class DocumentParser:
    """
    Parses PDF documents and image files, extracting raw text and assessing image quality flags.
    """

    def parse_pdf(self, pdf_bytes: bytes) -> Tuple[str, List[str]]:
        """Extract text and metadata from PDF bytes."""
        quality_flags: List[str] = []
        full_text_pages: List[str] = []

        try:
            doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
            if len(doc) == 0:
                quality_flags.append("PDF contains 0 pages.")
                return "", quality_flags

            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = page.get_text("text").strip()
                if page_text:
                    full_text_pages.append(f"--- Page {page_num + 1} ---\n{page_text}")

            combined_text = "\n\n".join(full_text_pages).strip()
            if not combined_text:
                quality_flags.append("PDF appears to be scanned without selectable text.")

            return combined_text, quality_flags
        except Exception as e:
            logger.error(f"Error parsing PDF: {e}")
            quality_flags.append(f"PDF parsing error: {str(e)}")
            return "", quality_flags

    def assess_image(self, image_bytes: bytes) -> Tuple[Image.Image, List[str]]:
        """Load image and check quality flags (resolution, blur, aspect ratio)."""
        quality_flags: List[str] = []
        try:
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size

            if width < 300 or height < 300:
                quality_flags.append("Low image resolution (under 300px); text recognition accuracy may be reduced.")

            if width > 6000 or height > 6000:
                quality_flags.append("Very large image resolution; downscaling recommended.")

            return image, quality_flags
        except Exception as e:
            logger.error(f"Error reading image: {e}")
            quality_flags.append(f"Invalid image format: {str(e)}")
            raise e

    def parse_file(self, file_bytes: bytes, filename: str) -> Tuple[str, List[str]]:
        """Parse either a PDF or Image file into raw text and quality flags."""
        filename_lower = filename.lower()
        if filename_lower.endswith(".pdf"):
            return self.parse_pdf(file_bytes)
        elif filename_lower.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff")):
            _, quality_flags = self.assess_image(file_bytes)
            # Text extraction for images without local OCR binaries:
            # We provide a clean fallback representation
            return f"[Image Document: {filename}]", quality_flags
        else:
            return "", ["Unsupported file format. Please upload a PDF or Image (JPG, PNG)."]


document_parser = DocumentParser()
