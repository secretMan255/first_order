import express, { Express, Request, Response } from 'express'
const app: Express = express()
import jwt from 'jsonwebtoken'
import { Cron } from './cron'
import { ECODE, STATUS, Resp, Order, Credential } from './type.js'
import { stat } from 'fs'

export class API {
     private readonly port: string
     private readonly cron: Cron
     private readonly key: string
     private readonly host: string

     constructor(port: string, cron: Cron, key: string, host: string) {
          this.port = port
          this.cron = cron
          this.key = key
          this.host = host
     }

     public async init() {
          app.use(express.json())
          const validateToken = (req: Request, res: Response, next: Function) => {
               const token = req.headers['authorization']?.split(' ')[1]

               if (!token) {
                    res.status(ECODE.ERROR).json({
                         staus: STATUS.FAIL,
                         msg: 'No bearer token provided',
                    })
                    return
               }

               try {
                    jwt.verify(token, this.key)

                    next()
               } catch (err: any) {
                    res.status(ECODE.ERROR).json({
                         status: STATUS.FAIL,
                         msg: 'Invalid credentials or token expired',
                    })
               }
          }

          app.get('/', async (req: Request, res: Response) => {
               res.status(ECODE.GOOD).json({ msg: 'ok' })
          })

          // secrect+password@#$
          app.post('/login', async (req: Request, res: Response) => {
               try {
                    const { username, password }: Credential = req.body

                    // Validate input
                    if (!username || !password) {
                         res.status(ECODE.ERROR).json({
                              status: STATUS.GOOD,
                              msg: 'Invalid username or password',
                         })
                         return
                    }

                    const result = await this.cron.login(username, password)
                    console.log(result)
                    if (result.status === STATUS.FAIL) {
                         res.status(ECODE.ERROR).json({
                              status: STATUS.FAIL,
                              msg: result.res,
                         })
                         return
                    }

                    const token = jwt.sign({ username }, this.key, { expiresIn: 300000 })

                    res.status(ECODE.GOOD).json({
                         status: STATUS.GOOD,
                         Bearer: `Bearer ${token}`,
                    })
               } catch (error: any) {
                    res.status(ECODE.ERROR).json({
                         status: ECODE.ERROR,
                         msg: 'Internal server error...',
                    })
               }
          })

          app.get('/items', validateToken, async (req: Request, res: Response) => {
               try {
                    console.log('items')
                    res.status(ECODE.GOOD).json(await this.cron.selectItem())
               } catch (error: any) {
                    res.status(ECODE.ERROR).json({
                         status: error.status,
                         message: error.res,
                    })
               }
          })

          app.post('/upt/item', validateToken, async (req: Request, res: Response) => {
               try {
                    const { itemId, name, type, price, pic, status } = req.body

                    if (itemId === '' || !itemId || name === '' || !name || type === '' || !type || price === '' || !price || pic === '' || !pic || status === '' || !status) {
                         res.status(ECODE.ERROR).json({
                              status: STATUS.FAIL,
                              msg: 'Invalid params',
                         })
                         return
                    }

                    const result = await this.cron.updateItem(itemId, name, type, price, pic, status)

                    res.status(ECODE.GOOD).json({
                         status: result.res,
                         msg: result.msg,
                    })
               } catch (err: any) {
                    res.status(ECODE.ERROR).json({
                         status: STATUS.FAIL,
                         msg: 'Internal Server Error...',
                    })
               }
          })

          app.post('/add/item', validateToken, async (req: Request, res: Response) => {
               try {
                    const { name, type, price, pic, status } = req.body

                    if (name === '' || !name || type === '' || !type || price === '' || !price || pic === '' || !pic || status === '' || !status) {
                         res.status(ECODE.ERROR).json({
                              status: STATUS.FAIL,
                              msg: 'Invalid params',
                         })
                         return
                    }

                    const result = await this.cron.addItem(name, type, price, pic, status)
                    console.log(result)
                    res.status(ECODE.GOOD).json({
                         result,
                    })
               } catch (err: any) {
                    res.status(ECODE.ERROR).json({
                         res: STATUS.FAIL,
                         msg: err,
                    })
               }
          })

          app.post('/dlt/item', validateToken, async (req: Request, res: Response) => {
               try {
                    const itemId: string = req.body

                    if (itemId === '' || !itemId) {
                         res.status(ECODE.ERROR).json({
                              status: STATUS.FAIL,
                              msg: 'Invalid params',
                         })
                         return
                    }

                    const result = await this.cron.deleteItem(itemId)

                    res.status(ECODE.GOOD).json({
                         result,
                    })
               } catch (err: any) {
                    res.status(ECODE.ERROR).json({
                         status: STATUS.FAIL,
                         msg: 'Server Interval Error...',
                    })
               }
          })

          app.post('/order', validateToken, async (req: Request, res: Response) => {
               try {
                    const { table_Id, orders }: { table_Id: number; orders: Order[] } = req.body

                    if (!table_Id || !orders) {
                         res.status(ECODE.ERROR).json({ status: STATUS.FAIL, msg: 'Invalid params' })
                    }

                    const result = await this.cron.order(table_Id, orders)
                    res.status(ECODE.GOOD).json(result)
               } catch (error: any) {
                    res.status(ECODE.ERROR).json({
                         status: error.status,
                         message: error.res,
                    })
               }
          })

          app.listen(this.port, () => {
               console.log(`Service is running on http://${this.host}:${this.port}/`)
          })
     }
}
