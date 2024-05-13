import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, WORKER_SECRET } from "./utils/config";

export function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers["authorization"];

    try {
        const decoded = jwt.verify(authHeader!, JWT_SECRET) as any;
        if (decoded.userId) {
            (req as any).userId = decoded.userId;
            return next();
        } else {
            return res.status(403).json({
                messsage: "Unathorized",
            });
        }
    } catch (error) {
        return res.status(403).json({
            messsage: "Unathorized",
        });
    }
}

export function workerAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers["authorization"];

    try {
        const decoded = jwt.verify(authHeader!, WORKER_SECRET) as any;
        if (decoded.userId) {
            (req as any).userId = decoded.userId;
            return next();
        } else {
            return res.status(403).json({
                messsage: "Unathorized",
            });
        }
    } catch (error) {
        return res.status(403).json({
            messsage: "Unathorized",
        });
    }
}
