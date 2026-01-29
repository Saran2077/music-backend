import express from "express"

const router = express.Router();

router.get("/")
router.get("/list")
router.get("/:id")
router.post("/")
router.put("/")
router.delete("/")

export default router;