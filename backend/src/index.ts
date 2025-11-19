// backend/src/index.ts
import express, { type Request, type Response } from 'express';

const app = express();
const port = 3001;

app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Hello from the TypeScript backend!' });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});