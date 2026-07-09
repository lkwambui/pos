import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { config } from '../config/app';
import { logger } from '../utils/logger';

const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, png, webp) are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

export const processImage = async (filePath: string, options?: { width?: number; height?: number; quality?: number }) => {
  try {
    const { width, height, quality = 80 } = options || {};
    const ext = path.extname(filePath).toLowerCase();
    const outputPath = filePath.replace(ext, '.webp');

    let pipeline = sharp(filePath).webp({ quality });

    if (width || height) {
      pipeline = pipeline.resize(width, height, { fit: 'inside', withoutEnlargement: true });
    }

    await pipeline.toFile(outputPath);

    if (outputPath !== filePath) {
      fs.unlinkSync(filePath);
    }

    return outputPath;
  } catch (error) {
    logger.error({ error, filePath }, 'Image processing failed');
    return filePath;
  }
};
