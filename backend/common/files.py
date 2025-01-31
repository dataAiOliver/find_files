from common.config import *
from io import BytesIO
from zipfile import ZipFile
from docx import Document as DOCUMENT_DOCX
from docx import Document
from pdf2image import convert_from_bytes
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import re, base64, pytesseract, io, fitz
import pandas as pd
from markitdown import MarkItDown


def file2md(fp):
    markitdown = MarkItDown()
    result = markitdown.convert(fp)
    return result.text_content


# Function to extract images from a DOCX file binary
def extract_images_from_docx(docx_binary):
    images_json = {}

    # Open the DOCX file as a zip archive
    with ZipFile(BytesIO(docx_binary)) as docx_zip:
        for file in docx_zip.namelist():
            # Images in DOCX are usually stored in the 'word/media/' directory
            if file.startswith("word/media/"):
                with docx_zip.open(file) as image_file:
                    # Read the image content
                    image_data = image_file.read()
                    # Encode the image content in base64
                    encoded_image = base64.b64encode(image_data).decode("utf-8")
                    # Store in JSON with the filename as the key
                    images_json[file] = encoded_image

    return images_json


def reduce_to_single_whitespace_and_newline(text):
    # Replace multiple newlines with a single newline
    text = re.sub(r"\n{2,}", "\n", text)  # Keep at least one newline
    # Replace multiple spaces/tabs with a single space
    text = re.sub(r"[ \t]{2,}", " ", text)  # Keep at least one space
    text = re.sub(r"[ \t]+$", "", text, flags=re.MULTILINE)  # Trailing spaces
    text = text.strip("\n")  # Trailing newlines
    return text


def docx_binary_to_string(binary_data):
    # Load the binary data into a Document object
    document = DOCUMENT_DOCX(BytesIO(binary_data))

    # Extract text from the document and join paragraphs with newlines
    text = "\n".join(paragraph.text for paragraph in document.paragraphs)

    text = reduce_to_single_whitespace_and_newline(text)

    return text


def is_scanned_pdf(pdf_binary_data):
    # Open the PDF from the binary data
    pdf_stream = BytesIO(pdf_binary_data)
    document = fitz.open(stream=pdf_stream, filetype="pdf")

    # Iterate through each page to check for text
    for page_num in range(len(document)):
        page = document.load_page(page_num)
        text = page.get_text()
        if text.strip():  # If text is found on the page
            return False  # The PDF contains selectable text

    return True  # No text found; likely a scanned document


def pdf_to_searchable_pdf(pdf_content: bytes) -> str:
    """
    Convert a binary PDF to a searchable PDF entirely in memory,
    and return the extracted OCR text as a single string.

    :param pdf_content: Binary content of the input PDF.
    :return: A string containing the extracted OCR text.
    """
    # Step 1: Convert PDF pages to images (in memory)
    images = convert_from_bytes(pdf_content, dpi=300)

    # Step 2: Perform OCR on each image
    ocr_texts = []
    for image in images:
        text = pytesseract.image_to_string(image, lang="eng")
        ocr_texts.append(text)

    # Combine all OCR text into one string
    full_ocr_text = "\n".join(ocr_texts)

    # Step 3: Create a new searchable PDF in memory (if needed)
    #
    #         If you want to generate a new, fully searchable PDF (in memory)
    #         rather than writing to disk, you can do so with the following code.
    #         If you do NOT need the PDF, you can skip this entire block.

    pdf_reader = PdfReader(io.BytesIO(pdf_content))
    pdf_writer = PdfWriter()

    for i, page in enumerate(pdf_reader.pages):
        # Create an in-memory PDF overlay containing the OCR text
        overlay_buffer = io.BytesIO()
        can = canvas.Canvas(overlay_buffer, pagesize=letter)
        can.drawString(
            100, 750, ocr_texts[i]
        )  # Simplistic text overlay at (x=100, y=750)
        can.save()

        # Merge the overlay onto the original PDF page
        overlay_buffer.seek(0)
        overlay_pdf = PdfReader(overlay_buffer)
        page.merge_page(overlay_pdf.pages[0])

        # Add the updated page to the writer
        pdf_writer.add_page(page)

    # (Optional) Get the final searchable PDF as bytes
    # output_pdf_buffer = io.BytesIO()
    # pdf_writer.write(output_pdf_buffer)
    # output_pdf_buffer.seek(0)
    # searchable_pdf_bytes = output_pdf_buffer.getvalue()

    # Step 4: Return the extracted text
    return full_ocr_text


def binary2txt(file_content_binary, file_type):
    s = None
    j_images = None
    if file_type == "docx":
        logger.info(f"binary2txt: DOCX")
        # only check if images, but do not evaluate yet
        j_images = extract_images_from_docx(file_content_binary)
        s = docx_binary_to_string(file_content_binary)
    elif file_type == "pdf":
        # todo: Try find out different categories.
        if is_scanned_pdf(file_content_binary):
            logger.info(f"Scanned Document")
            s = pdf_to_searchable_pdf(file_content_binary)
        else:
            s = pdf_to_searchable_pdf(file_content_binary)
    # todo: currently only reading first sheet. Fix this.
    elif file_type == "xlsx":
        excel_data = pd.ExcelFile(BytesIO(file_content_binary))
        df = excel_data.parse(excel_data.sheet_names[0])
        s = df.to_markdown()
    else:
        logger.error(f"UNKNOWN FILETYPE FOR binary2txt: {file_type}")

    return s, j_images


def read_binary_file(fp, sftp=None):
    if sftp:
        logger.info(f"Read Remote File {fp}")
        with sftp.open(fp, "r") as remote_file:
            file_content_binary = remote_file.read()
    else:
        logger.info(f"Read Remote File {fp}")
        with open(fp, "rb") as remote_file:
            file_content_binary = remote_file.read()

    # trasnform binary content to string
    doc_content_string, j_images = binary2txt(file_content_binary, fp.split(".")[-1])

    return file_content_binary, doc_content_string, j_images


def read_a_file(fp, sftp=None):
    if sftp:
        logger.info(f"Read Remote File {fp}")
        with sftp.open(fp, "r") as remote_file:
            file_content_binary = remote_file.read()
    else:
        logger.info(f"Read Remote File {fp}")
        with open(fp, "rb") as remote_file:
            file_content_binary = remote_file.read()

    # trasnform binary content to string
    doc_content_string, j_images = binary2txt(file_content_binary, fp.split(".")[-1])

    return file_content_binary, doc_content_string, j_images
