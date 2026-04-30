const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ─── S3 Client ────────────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;

// ─── Upload file to S3 ───────────────────────────────────────────────────────
const uploadToS3 = async (file, folder = 'products') => {
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const key = `${folder}/${uuidv4()}${ext}`;

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  });

  await upload.done();

  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com/${key}`;
  return { url, key };
};

// ─── Delete file from S3 ─────────────────────────────────────────────────────
const deleteImage = async (key) => {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.error('Failed to delete S3 object:', err.message);
  }
};

// ─── Multer — memory storage (we upload to S3 manually in controllers) ────────
const imageFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

const uploadAbayaImages = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

const uploadReceipt = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file. Only .xlsx, .xls, or .csv allowed.'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { uploadAbayaImages, uploadExcel, uploadReceipt, deleteImage, uploadToS3, s3 };
