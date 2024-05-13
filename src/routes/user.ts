import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../utils/config";
import { authMiddleware } from "../middleware";
import { createPresignedUrlWithoutClient } from "../utils";
import { createTaskInput } from "../types";
import { BUCKET, DEFAULT_TITLE, REGION } from "../utils/config";

const router = Router();
const prismaClient = new PrismaClient();

router.get("/task", authMiddleware, async (req, res) => {
    const taskId = req.query.taskId;
    const userId = (req as any).userId;

    console.log("userId:", userId);
    console.log("taskId:", taskId);

    const taskDetails = await prismaClient.task.findFirst({
        where: {
            user_id: Number(userId),
            id: Number(taskId),
        },
        include: {
            options: true,
        },
    });

    if (!taskDetails) {
        return res.status(411).json({
            message: "No access to task",
        });
    }

    const responses = await prismaClient.submission.findMany({
        where: {
            task_id: Number(taskId),
        },
        include: {
            option: true,
        },
    });

    const result: Record<
        string,
        {
            count: number;
            option: {
                imageUrl: string;
            };
        }
    > = {};

    taskDetails.options.forEach((o) => {
        result[o.id] = {
            count: 0,
            option: {
                imageUrl: o.image_url,
            },
        };
    });

    responses.forEach((r) => {
        result[r.option_id].count += 1;
    });

    res.json({
        result,
    });
});

router.post("/task", authMiddleware, async (req, res) => {
    const userId = (req as any).userId;
    const body = req.body;

    const parsedData = createTaskInput.safeParse(body);

    if (!parsedData.success) {
        return res.status(411).json({
            message: "Sent wrong inputs",
        });
    }

    const response = await prismaClient.$transaction(async (tx) => {
        const response = await tx.task.create({
            data: {
                title: parsedData.data.title ?? DEFAULT_TITLE,
                amount: "1",
                signature: parsedData.data.signature,
                user_id: userId,
            },
        });

        await tx.option.createMany({
            data: parsedData.data.options.map((x) => ({
                image_url: x.imageUrls,
                task_id: response.id,
            })),
        });

        return response;
    });

    res.json({
        id: response.id,
    });
});

router.get("/presigned-url", authMiddleware, async (req, res) => {
    const userId = (req as any).userId;
    const KEY = `saas/${userId}/${Math.random()}/image.png`;
    const clientUrl = await createPresignedUrlWithoutClient({
        region: REGION,
        bucket: BUCKET,
        key: KEY,
    });

    res.json({
        clientUrl,
    });
});

router.post("/signin", async (req, res) => {
    const walletAddress = "8Lt7RN92GqSAiFsA8Z6s1Qzy4p8AUDas9DxnTYT3kkTg";

    const existingUser = await prismaClient.user.findFirst({
        where: {
            address: walletAddress,
        },
    });

    if (existingUser) {
        const token = jwt.sign(
            {
                userId: existingUser.id,
            },
            JWT_SECRET
        );

        res.json({
            token,
        });
    } else {
        const user = await prismaClient.user.create({
            data: { address: walletAddress },
        });
        const token = jwt.sign(
            {
                userId: user.id,
            },
            JWT_SECRET
        );

        res.json({
            token,
        });
    }
});

export default router;
