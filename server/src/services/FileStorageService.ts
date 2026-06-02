import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class FileStorageService {
  private s3: S3Client;
  private bucketName: string;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'ap-southeast-1',
    });
    this.bucketName = process.env.AWS_S3_BUCKET || 'dosen-portfolio-bucket';
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const s3Key = `${folder}/${Date.now()}_${file.originalname}`;
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${s3Key}`;
  }
}
