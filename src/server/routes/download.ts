import { Router } from "express";
import {
  downloadController,
  downloadByQueryController,
  infoController,
} from "../controllers/downloadController.js";

const downloadRouter = Router();

downloadRouter.post("/info", infoController);
downloadRouter.post("/download", downloadController);
downloadRouter.get("/download", downloadByQueryController);

export default downloadRouter;
