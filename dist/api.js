import express from 'express';
const app = express();
import jwt from 'jsonwebtoken';
import { ECODE, STATUS } from './type.js';
export class API {
    constructor(port, cron, key) {
        this.port = port;
        this.cron = cron;
        this.jwt_key = key;
    }
    async init() {
        app.use(express.json());
        app.get('/', async (req, res) => {
            res.status(ECODE.GOOD).json({ msg: 'ni hao ma' });
        });
        // secrect+password@#$
        app.post('/login', async (req, res) => {
            try {
                const { username, password } = req.body;
                // Validate input
                if (!username || !password) {
                    res.status(ECODE.ERROR).json({
                        status: STATUS.GOOD,
                        msg: 'Invalid username or password',
                    });
                    return;
                }
                const result = await this.cron.login(username, password);
                if (result.status === STATUS.FAIL) {
                    res.status(ECODE.ERROR).json({
                        statuss: STATUS.FAIL,
                        msg: result.res,
                    });
                    return;
                }
                res.status(ECODE.GOOD).json({
                    status: STATUS.GOOD,
                    token: jwt.sign({ username }, this.jwt_key, { expiresIn: 30 }),
                });
            }
            catch (error) {
                console.log(error);
                res.status(ECODE.ERROR).json({
                    status: ECODE.ERROR,
                    msg: 'Internal server error...',
                });
            }
        });
        app.get('/items/:status?', async (req, res) => {
            const status = Number(req.params.status);
            try {
                if (!status) {
                    res.status(ECODE.ERROR).json({
                        status: STATUS.FAIL,
                        msg: 'Invalid status',
                    });
                    return;
                }
                const items = await this.cron.selectItem(status);
                res.status(ECODE.GOOD).json({
                    status: STATUS.GOOD,
                    items,
                });
            }
            catch (error) {
                res.status(ECODE.ERROR).json({
                    status: error.status,
                    message: error.res,
                });
            }
        });
        app.post('/order', async (req, res) => {
            try {
                const tableId = req.body.table_id;
                const orders = req.body.orders;
                if (!tableId || !orders) {
                    res
                        .status(ECODE.ERROR)
                        .json({ status: STATUS.FAIL, msg: 'Invalid params' });
                }
                const result = await this.cron.order(tableId, orders);
                res.status(ECODE.GOOD).json(result);
            }
            catch (error) {
                res.status(ECODE.ERROR).json({
                    status: error.status,
                    message: error.res,
                });
            }
        });
        app.listen(this.port, () => {
            console.log(`Service is running on http://192.168.100.14:${this.port}/`);
        });
    }
}
