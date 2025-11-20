// backend/src/index.ts
import express, { type Request, type Response } from 'express';
import cors from 'cors'; 

const app = express();
const port = 3001;

app.use(cors()); 

app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Hello from the TypeScript backend!' });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});