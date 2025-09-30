import fs from 'fs-extra';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { fileTypeFromBuffer } from 'file-type';

// read content
export async function readFileContent(filePath: string): Promise<string> {
  try {
    if (!filePath) {
      console.warn('File path is empty');
      return '';
    }

    // create absolute path
    const absolutePath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), filePath);

    console.log(`Reading file: ${absolutePath}`);

    // check file exist or not
    const exists = await fs.pathExists(absolutePath);
    if (!exists) {
      console.warn(`File not found: ${absolutePath}`);
      return '';
    }

    // read file as buffer
    const buffer = await fs.readFile(absolutePath);
    
    // read format file
    const fileType = await detectFileType(buffer, filePath);
    console.log(`Detected file type: ${fileType}`);

    // parse by format file
    switch (fileType) {
      case 'pdf':
        return await parsePdf(buffer);
      case 'docx':
        return await parseDocx(buffer);
      case 'doc':
        return await parseDoc(buffer);
      case 'txt':
      case 'md':
      case 'text':
      default:
        return await parseText(buffer);
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return '';
  }
}

// Deteksi format file berdasarkan magic bytes dan ekstensi
export async function detectFileType(buffer: Buffer, filePath: string): Promise<string> {
  try {
    // try detect format file
    const fileType = await fileTypeFromBuffer(buffer);
    
    if (fileType) {
      switch (fileType.mime) {
        case 'application/pdf':
          return 'pdf';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return 'docx';
        case 'application/msword':
          return 'doc';
        case 'text/plain':
          return 'txt'
      }
    }

    // return format file
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.pdf':
        return 'pdf';
      case '.docx':
        return 'docx';
      case '.doc':
        return 'doc';
      case '.txt':
        return 'txt';
      case '.md':
        return 'md';
      default:
        return 'text';
    }
  } catch (error) {
    console.error('Error detecting file type:', error);
    return 'text';
  }
}

// Parse PDF file
export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    console.log('Parsing PDF...');
    const data = await pdfParse(buffer);
    console.log(`PDF parsed. Text length: ${data.text.length}`);
    return data.text.trim();
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return '';
  }
}

// Parse DOCX file
export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    console.log('Parsing DOCX...');
    const result = await mammoth.extractRawText({ buffer });
    console.log(`DOCX parsed. Text length: ${result.value.length}`);
    
    if (result.messages.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages);
    }
    
    return result.value.trim();
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    return '';
  }
}

// Parse DOC file (legacy Word format)
export async function parseDoc(buffer: Buffer): Promise<string> {
  try {
    console.log('Parsing DOC (legacy format)...');
    // DOC format is more complex, you can use libraries like antiword or textract
    // For now, just return empty and log a warning
    console.warn('DOC format not fully supported. Please convert to DOCX or PDF.');
    return '';
  } catch (error) {
    console.error('Error parsing DOC:', error);
    return '';
  }
}

// Parse text file (TXT, MD, etc)
export async function parseText(buffer: Buffer): Promise<string> {
  try {
    console.log('Parsing as text file...');
    
    // Try different encodings
    const encodings = ['utf8', 'utf16le', 'latin1'];
    
    for (const encoding of encodings) {
      try {
        const content = buffer.toString(encoding as BufferEncoding);
        
        // Validate whether the content is readable
        if (await isReadableText(content)) {
          console.log(`Text parsed with ${encoding}. Length: ${content.length}`);
          return content.trim();
        }
      } catch (err) {
        continue;
      }
    }
    
    console.warn('Could not parse as readable text');
    return '';
  } catch (error) {
    console.error('Error parsing text:', error);
    return '';
  }
}

// Check if the text is readable (not binary)
export function isReadableText(content: string): boolean {
  if (!content || content.length === 0) return false;
  
  // Calculate the ratio of printable characters
  const printableChars = content.match(/[\x20-\x7E\s\n\r\t]/g);
  const printableRatio = printableChars ? printableChars.length / content.length : 0;
  
  // At least 70% of the characters must be printable
  return printableRatio > 0.7;
}
