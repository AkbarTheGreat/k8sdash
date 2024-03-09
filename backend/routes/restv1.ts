import express, { Request, Response } from 'express';
import { getServerStructure, latestForImage } from '../util/services';
var router = express.Router();

/* GET services running on kubernetes. */
router.get("/services", (req: Request, res: Response) => {
    getServerStructure().then(response => {
        res.json(response);
    });
});

/* GET latest docker version. */
router.get("/docker/latest", (req: Request, res: Response) => {
    latestForImage(req.query.image as string).then(response => {
        res.json(response);
    });
});

export default router;

