import express from "express"
import Handler from "./handler.js";

const router = express.Router();
const handler = new Handler();

router.get('/auth', handler.auth);

router.get('/auth/callback', handler.authCallback);

export default router;