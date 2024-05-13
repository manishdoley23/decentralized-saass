import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { WORKER_SECRET } from "../utils/config";
import { workerAuthMiddleware } from "../middleware";

const router = Router();

const prismaClient = new PrismaClient();

router.get("/nextTask", workerAuthMiddleware, async (req, res) => {
    const userId = (req as any).userId;

    const task = prismaClient.task.findFirst({
        where: {
            done: false,
            submissions: {
                none: {
                    worker_id: userId,
                },
            },
        },
        select: {
            options: true,
        },
    });

    if (!task) {
        res.status(411).json({
            message: "No more tasks left",
        });
    } else {
        res.json({
            task,
        });
    }
});

router.post("/signin", async (req, res) => {
    const walletAddress = "8Lt7RN92GqSAiFsA8Z6s1Qzy4p8AUDas9DxnTYT3kkTa";

    const existingUser = await prismaClient.worker.findFirst({
        where: {
            address: walletAddress,
        },
    });

    if (existingUser) {
        const token = jwt.sign(
            {
                userId: existingUser.id,
            },
            WORKER_SECRET
        );

        res.json({
            token,
        });
    } else {
        const user = await prismaClient.worker.create({
            data: {
                address: walletAddress,
                pending_amount: 0,
                locked_amount: 0,
            },
        });
        const token = jwt.sign(
            {
                userId: user.id,
            },
            WORKER_SECRET
        );

        res.json({
            token,
        });
    }
});

export default router;
