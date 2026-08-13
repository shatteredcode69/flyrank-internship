import express from 'express';
import { fakePlatformRouter } from './routes.js';

const app = express();
app.use(express.json({ limit: '10mb' })); // generous — carries base64 image payloads
app.use(fakePlatformRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Fake social platform server listening on :${port}`);
});
