const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function extractTextFromBuffer(fileBuffer, mimeType) {
    let textContent = '';
    if (mimeType === 'application/pdf') {
        const data = await pdfParse(fileBuffer);
        textContent = data.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // DOCX file
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        textContent = result.value;
    } else if (mimeType.startsWith('text/')) {
        // Plain text file
        textContent = fileBuffer.toString('utf-8');
    } else {
        throw new Error('Invalid file type. Only PDF, DOCX, and text files are supported.');
    }
    return textContent;
}

module.exports = {
    extractTextFromBuffer
};