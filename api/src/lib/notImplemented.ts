import type { Request, Response } from "express";

export function notImplemented(req: Request, res: Response): void {
  res.status(501).json({
    error: "Not implemented",
    method: req.method,
    path: req.originalUrl,
  });
}
