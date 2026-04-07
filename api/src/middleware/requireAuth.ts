import type { RequestHandler } from "express";
import { COOKIE_NAME, verifyUserToken } from "../lib/jwt.js";

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { sub } = verifyUserToken(token);
    req.userId = sub;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};
