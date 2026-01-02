/**
 * PBO (Bohemia Interactive Packing) Utility
 * Implements the PBO file format for packing SQF and CPP files into binary addons.
 */

export interface PBOFile {
  name: string;
  content: string | Uint8Array;
}

export async function createPBO(files: PBOFile[], prefix: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();

  // Normalize path separators to forward slashes (PBO standard)
  const normalizedFiles = files.map(f => ({
    ...f,
    name: f.name.replace(/\\/g, '/')
  }));

  // Sort files alphabetically (case-insensitive) - required by Arma 3
  const sortedFiles = [...normalizedFiles].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  // Prepare file data buffers
  const fileBuffers: Uint8Array[] = sortedFiles.map(f =>
    typeof f.content === 'string' ? encoder.encode(f.content) : f.content
  );

  // Calculate header size
  // Header structure:
  // 1. Version entry (empty name + 0x56657273 signature + properties)
  // 2. File entries
  // 3. Terminal entry (21 zero bytes)

  // Property entry header: empty name (1 byte) + 20 bytes header + property data
  const prefixProperty = encoder.encode(`prefix\0${prefix}\0`);
  const propertyHeaderSize = 1 + 20 + prefixProperty.length + 1; // +1 for terminating null

  // File entry headers: name + null + 20 bytes each
  let fileHeadersSize = 0;
  for (const file of sortedFiles) {
    fileHeadersSize += encoder.encode(file.name).length + 1 + 20;
  }

  // Terminal entry: 21 zero bytes
  const terminalSize = 21;

  const headerSize = propertyHeaderSize + fileHeadersSize + terminalSize;

  // Calculate total data size
  let totalDataSize = 0;
  for (const buf of fileBuffers) {
    totalDataSize += buf.length;
  }

  // Total: header + data + 20 byte checksum
  const pboBuffer = new Uint8Array(headerSize + totalDataSize + 20);
  const view = new DataView(pboBuffer.buffer);
  let offset = 0;

  // Write version/property entry header
  pboBuffer[offset++] = 0; // Empty filename
  view.setUint32(offset, 0x56657273, true); offset += 4; // "sreV" magic (Vers backwards)
  view.setUint32(offset, 0, true); offset += 4; // Original size (0 for property entry)
  view.setUint32(offset, 0, true); offset += 4; // Reserved
  view.setUint32(offset, 0, true); offset += 4; // Timestamp
  view.setUint32(offset, 0, true); offset += 4; // Data size (0 - properties are in header)

  // Write prefix property inline in header
  pboBuffer.set(prefixProperty, offset);
  offset += prefixProperty.length;
  pboBuffer[offset++] = 0; // Terminate properties section

  // Write file entry headers
  for (let i = 0; i < sortedFiles.length; i++) {
    const nameBytes = encoder.encode(sortedFiles[i].name);
    pboBuffer.set(nameBytes, offset);
    offset += nameBytes.length;
    pboBuffer[offset++] = 0; // Null terminator

    const size = fileBuffers[i].length;
    view.setUint32(offset, 0, true); offset += 4; // Method (0 = uncompressed)
    view.setUint32(offset, size, true); offset += 4; // Original size
    view.setUint32(offset, 0, true); offset += 4; // Reserved
    view.setUint32(offset, 0, true); offset += 4; // Timestamp
    view.setUint32(offset, size, true); offset += 4; // Data size
  }

  // Write terminal entry (21 zero bytes)
  for (let i = 0; i < 21; i++) {
    pboBuffer[offset++] = 0;
  }

  // Write file data
  for (const buffer of fileBuffers) {
    pboBuffer.set(buffer, offset);
    offset += buffer.length;
  }

  // Write checksum placeholder (20 zero bytes - Arma accepts this for local mods)
  for (let i = 0; i < 20; i++) {
    pboBuffer[offset++] = 0;
  }

  return pboBuffer;
}
