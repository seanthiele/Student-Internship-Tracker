import { Router, type IRouter } from "express";
import healthRouter from "./health";
import internshipsRouter from "./internships";
import applicationLogsRouter from "./application-logs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(internshipsRouter);
router.use(applicationLogsRouter);

export default router;
