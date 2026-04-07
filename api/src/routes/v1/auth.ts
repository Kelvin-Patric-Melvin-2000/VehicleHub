import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../../models/User.js";
import { COOKIE_NAME, SEVEN_DAYS_MS, signUserToken, verifyUserToken } from "../../lib/jwt.js";

const router = Router();

router.post("/auth/sign-up", async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const display_name =
      typeof req.body?.display_name === "string" ? req.body.display_name.trim() || null : null;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash, display_name });
    const token = signUserToken(user._id.toString());
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: SEVEN_DAYS_MS,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(201).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        display_name: user.display_name,
      },
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === 11000) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Sign up failed" });
  }
});

router.post("/auth/sign-in", async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = signUserToken(user._id.toString());
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: SEVEN_DAYS_MS,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        display_name: user.display_name,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Sign in failed" });
  }
});

router.post("/auth/sign-out", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/", sameSite: "lax" });
  res.json({ ok: true });
});

router.get("/auth/session", async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { sub } = verifyUserToken(token);
    const user = await User.findById(sub).select("email display_name").lean();
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        display_name: user.display_name,
      },
    });
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
});

export default router;
