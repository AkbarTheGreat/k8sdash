import express, { Request, Response } from 'express';
import { getServerStructure } from '../util/services';
var router = express.Router();

/* GET services running on kubernetes. */
router.get("/services", (req: Request, res: Response) => {
    getServerStructure().then(response => {
        res.json(response);
    });
});

export default router;

