import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';

export function uploadPlugin(): Plugin {
  return {
    name: 'upload-plugin',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.url?.startsWith('/api/upload')) {
          if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          try {
            const chunks: Buffer[] = [];
            
            req.on('data', (chunk: Buffer) => {
              chunks.push(chunk);
            });

            req.on('end', async () => {
              try {
                const buffer = Buffer.concat(chunks);
                const contentType = req.headers['content-type'] || '';
                
                // Parse multipart form data
                const boundary = contentType.match(/boundary=([^;]+)/)?.[1];
                if (!boundary) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'No boundary found' }));
                  return;
                }

                const parts = buffer.toString('binary').split(`--${boundary}`);
                let fileData: Buffer | null = null;
                let fileName = '';

                for (const part of parts) {
                  if (part.includes('Content-Disposition')) {
                    const filenameMatch = part.match(/filename="([^"]+)"/);
                    if (filenameMatch) {
                      fileName = filenameMatch[1];
                      const dataStart = part.indexOf('\r\n\r\n') + 4;
                      const dataEnd = part.lastIndexOf('\r\n');
                      fileData = Buffer.from(part.slice(dataStart, dataEnd), 'binary');
                      break;
                    }
                  }

                  if (fileData) break;
                }

                if (!fileData || !fileName) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'No file found' }));
                  return;
                }

                // Determine upload directory
                const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                if (!fs.existsSync(uploadDir)) {
                  fs.mkdirSync(uploadDir, { recursive: true });
                }

                // Generate unique filename
                const ext = path.extname(fileName);
                const baseName = path.basename(fileName, ext);
                const uniqueName = `${baseName}-${Date.now()}${ext}`;
                const filePath = path.join(uploadDir, uniqueName);

                // Write file
                fs.writeFileSync(filePath, fileData);

                // Return public URL
                const publicUrl = `/uploads/${uniqueName}`;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ url: publicUrl }));
              } catch (error) {
                console.error('Upload error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Upload failed' }));
              }
            });
          } catch (error) {
            console.error('Upload error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Upload failed' }));
          }
        } else {
          next();
        }
      });
    },
  };
}
