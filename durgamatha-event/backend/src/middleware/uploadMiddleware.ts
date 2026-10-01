import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import os from 'node:os'
import { MAX_FILES_PER_UPLOAD, VIDEO_MAX_BYTES } from '../utils/mediaValidation'

// multer reads the uploaded files ("multipart/form-data") that express.json() cannot read.
// Files are written to the operating system's TEMPORARY folder (not kept in memory, so a
// 100 MB video can't use up the server's RAM). The media controller deletes every temp file
// as soon as it has been sent to Cloudinary; nothing is stored on the server permanently.
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: VIDEO_MAX_BYTES, // the biggest allowed file; the smaller image limit is checked per file
    files: MAX_FILES_PER_UPLOAD,
  },
})

// Accepts up to 10 files sent in the "files" field and turns multer's errors into clear messages
export function uploadMediaFiles(req: Request, res: Response, next: NextFunction) {
  upload.array('files', MAX_FILES_PER_UPLOAD)(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ success: false, message: 'File too large. Images must be at most 10 MB and videos at most 100 MB.' })
        return
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        res.status(400).json({
          success: false,
          message: `Send at most ${MAX_FILES_PER_UPLOAD} files per upload, in the "files" field.`,
        })
        return
      }
      res.status(400).json({ success: false, message: 'Invalid upload.' })
      return
    }
    next(err) // no error: continue; any other error: the error handler deals with it
  })
}
