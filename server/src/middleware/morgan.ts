import { Request, Response, NextFunction } from 'express';

const morganMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const contentLength = res.get('content-length') || '-';
    // Matches the previously configured morgan format:
    // :method :url :status :res[content-length] - :response-time ms
    console.log(`${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${contentLength} - ${duration} ms`);
  });

  next();
};

export default morganMiddleware;
