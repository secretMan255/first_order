import mysql from 'mysql'
import { STATUS, Items, ItemGroup } from './type.js'

export class COMMON {
     private readonly dbConn: mysql.Connection

     constructor(dbConn: string) {
          this.dbConn = mysql.createConnection(dbConn)

          this.dbConn.connect((err) => {
               if (err) {
                    this.log('Mysql: ' + err.message)
                    return
               }
               this.log('Mysql connected')
          })
     }

     public async exec(procName: string, params: any[]): Promise<any> {
          const placeholders = params.map(() => '?').join(',')
          const query = `CALL ${procName}(${placeholders});`

          return new Promise((resolve, reject) => {
               this.dbConn.query(query, params, (err, results) => {
                    if (err) {
                         this.log(`MYSQL: Error executing stored procedure: ${err}`)
                         return reject({ status: 0, res: err.sqlMessage })
                    }
                    const result = results[0].map((row: any) => ({ ...row }))
                    resolve({ status: 1, res: result })
               })
          })
     }

     public log(msg: any) {
          const date: string = new Date().toUTCString()
          console.log(`${date}: ${msg}`)
     }

     public generateOrderId(table_id: number) {
          const dateNow = new Date()
          return `${table_id}${dateNow.getHours()}${dateNow.getMinutes()}`
     }

     public async selectItem() {
          const result: { status: number; res: Items[] } = await this.exec('or_get_item', [1])
          const items: ItemGroup = {}

          if (result.status === STATUS.FAIL) {
               return { result }
          }

          for (let x = 0; x < result.res.length; x++) {
               const item: Items = result.res[x]
               if (!items[item.type]) {
                    items[item.type] = []
               }

               items[item.type].push({ name: item.name, price: item.price, pic: item.pic })
          }

          return { status: STATUS.GOOD, items }
     }

     public async updateItem(itemId: string, name: string, type: string, price: string, pic: string, status: string) {
          return await this.exec('or_utp_item', [itemId, name, type, price, pic, status])
     }

     public async order(tableId: number, orders: any[]) {
          if (!tableId || orders.length <= 0) {
               return { status: STATUS.FAIL, res: `Invalid tableId or empty orders` }
          }

          const orderId: string = this.generateOrderId(tableId)
          const responses: { status: number; res: string }[] = []

          for (const order of orders) {
               if (!order.item_id || !order.qty) {
                    return {
                         status: STATUS.FAIL,
                         res: `Invalid order: item_id and qty are required`,
                    }
               }
          }

          for (const order of orders) {
               try {
                    const resp = await this.exec('or_ins_order', [orderId, tableId, order.item_id, order.qty, new Date()])

                    if (resp.status !== STATUS.GOOD) {
                         return {
                              status: STATUS.FAIL,
                              res: `Order insertion failed for item_id: ${order.item_id}`,
                         }
                    }

                    if (resp.res[0].res) {
                         return {
                              status: STATUS.FAIL,
                              res: `Order insertion failed for item_id: ${order.item_id}`,
                         }
                    }
                    responses.push(resp.res[0])
               } catch (error) {
                    return {
                         status: STATUS.FAIL,
                         res: `Error processing order for item_id: ${order.item_id}`,
                    }
               }
          }

          // All orders processed successfully
          return {
               status: STATUS.GOOD,
               res: `Order placed successfully with orderId: ${orderId}`,
          }
     }

     public async deleteItem(itemId: string) {
          return this.exec('or_del_item', [itemId])
     }

     public async login(username: string, password: string) {
          const resp: { status: number; res: { auth: number }[] } = await this.exec('or_user_rec', [username, password])

          if (resp.status === STATUS.FAIL) {
               return { resp }
          }

          if (resp.res[0].auth >= 1) {
               return { status: STATUS.GOOD, res: 'login successfully' }
          } else {
               return { status: STATUS.FAIL, res: 'Invalid user or password' }
          }
     }

     public async addItem(name: string, type: string, price: string, pic: string, status: string) {
          const res = await this.exec('or_add_item', [name, type, price, pic, status])
          console.log(res)

          return res
     }

     public async closeMysqlConnection() {
          this.dbConn.end((err) => {
               if (err) {
                    this.log('MYSQL: ' + err)
                    return
               }
          })

          this.log('Mysql connectin close... ')
     }
}
