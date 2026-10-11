import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const maxDuration = 60;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: Request) {
  try {
    const { base64File, path } = await req.json();

    if (!base64File || !path) {
      return NextResponse.json({ error: 'Missing base64File or path' }, { status: 400 });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary environment variables are not configured' }, { status: 500 });
    }

    const uploadSource = base64File.startsWith('data:')
      ? base64File
      : `data:image/jpeg;base64,${base64File}`;
    const publicId = path.replace(/[^a-zA-Z0-9/_-]/g, '_');
    const result = await cloudinary.uploader.upload(uploadSource, {
      public_id: publicId,
      resource_type: 'image',
      overwrite: false,
      unique_filename: true,
    });

    return NextResponse.json({ success: true, url: result.secure_url });

  } catch (error: any) {
    console.error('API Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
