import mysql from 'mysql';
import { STATUS } from './type.js';
export class COMMON {
    constructor(dbConn) {
        this.dbConn = mysql.createConnection(dbConn);
        this.dbConn.connect((err) => {
            if (err) {
                this.log('Mysql: ' + err.message);
                return;
            }
            this.log('Mysql connected');
        });
    }
    async exec(procName, params) {
        const placeholders = params.map(() => '?').join(',');
        const query = `CALL ${procName}(${placeholders});`;
        return new Promise((resolve, reject) => {
            this.dbConn.query(query, params, (err, results) => {
                if (err) {
                    this.log(`MYSQL: Error executing stored procedure: ${err}`);
                    return reject({ status: 0, res: err.sqlMessage });
                }
                const result = results[0].map((row) => (Object.assign({}, row)));
                resolve({ status: 1, res: result });
            });
        });
    }
    log(msg) {
        const date = new Date();
        console.log(`${date}: ${msg}`);
    }
    generateOrderId(table_id) {
        const dateNow = new Date();
        return `${table_id}${dateNow.getHours()}${dateNow.getMinutes()}`;
    }
    async selectItem(status) {
        return await this.exec('or_get_item', [status]);
    }
    async order(tableId, orders) {
        if (!tableId || orders.length <= 0) {
            return { status: STATUS.FAIL, res: `Invalid tableId or empty orders` };
        }
        const orderId = this.generateOrderId(tableId);
        const responses = [];
        for (const order of orders) {
            if (!order.item_id || !order.qty) {
                return {
                    status: STATUS.FAIL,
                    res: `Invalid order: item_id and qty are required`,
                };
            }
        }
        for (const order of orders) {
            try {
                const resp = await this.exec('or_ins_order', [
                    orderId,
                    tableId,
                    order.item_id,
                    order.qty,
                    new Date(),
                ]);
                if (resp.status !== STATUS.GOOD) {
                    return {
                        status: STATUS.FAIL,
                        res: `Order insertion failed for item_id: ${order.item_id}`,
                    };
                }
                responses.push(resp.res[0]);
            }
            catch (error) {
                return {
                    status: STATUS.FAIL,
                    res: `Error processing order for item_id: ${order.item_id}`,
                };
            }
        }
        // All orders processed successfully
        return {
            status: STATUS.GOOD,
            res: `Order placed successfully with orderId: ${orderId}`,
        };
    }
    async login(username, password) {
        const resp = await this.exec('or_user_rec', [
            username,
            password,
        ]);
        if (resp.status === STATUS.FAIL || resp === null) {
            return { status: 0, res: 'Invalid user or password' };
        }
        console.log(resp);
        if (resp.status > 0) {
            return { status: 1, res: 'login successfully' };
        }
        else {
            return { status: STATUS.FAIL, res: 'Unexception case...' };
        }
    }
    async closeMysqlConnection() {
        this.dbConn.end((err) => {
            if (err) {
                this.log('MYSQL: ' + err);
                return;
            }
        });
        this.log('Mysql connectin close... ');
    }
}
