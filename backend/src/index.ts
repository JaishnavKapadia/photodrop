import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize Clients
const prisma = new PrismaClient();
if (!process.env.AWS_REGION) throw new Error("Missing AWS_REGION");
if (!process.env.AWS_ACCESS_KEY_ID) throw new Error("Missing AWS_ACCESS_KEY_ID");
if (!process.env.AWS_SECRET_ACCESS_KEY) throw new Error("Missing AWS_SECRET_ACCESS_KEY");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


const app = express();
const port = 3001;

app.use(cors());
app.use(express.json()); 

app.get('/', (req, res) => {
  res.send('Retrace Backend is Live (Render/AWS Hybrid)');
});

app.post('/api/trips', async (req, res) => {
  try {
    const { title, filenames, userId } = req.body;

    const slug = title.toLowerCase().replace(/ /g, '-') + '-' + Date.now();
    
    const trip = await prisma.trips.create({
      data: {
        user_id: userId, 
        title: title,
        slug: slug,
      },
    });

    const uploadPromises = filenames.map(async (filename: string) => {
      const key = `trips/${trip.id}/${filename}`; 
      
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        ContentType: 'image/jpeg', // Assuming JPEGs for now
      });

      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 600 }); // Link valid for 10 mins

      return {
        filename,
        signedUrl, 
        key,       
        publicUrl: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`
      };
    });

    const uploads = await Promise.all(uploadPromises);

    res.json({
      trip,
      uploads 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

app.post('/api/photos', async (req, res) => {
  try {
    const { tripId, photoData } = req.body; 
    // photoData is an array of { s3_key, url, latitude, longitude }

    const result = await prisma.photos.createMany({
      data: photoData.map((p: any) => ({
        trip_id: tripId,
        s3_key: p.s3_key,
        url: p.url,
        latitude: p.latitude,
        longitude: p.longitude,
      }))
    });

    res.json({ success: true, count: result.count });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save photos' });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});