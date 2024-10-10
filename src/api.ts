import express, { Express, Request, Response } from 'express'
const app: Express = express()
import jwt from 'jsonwebtoken'
import { Cron } from './cron'
import { ECODE, STATUS, Resp } from './type.js'

export class API {
  private readonly port: string
  private readonly cron: Cron
  private readonly jwt_key: string

  constructor(port: string, cron: Cron, key: string) {
    this.port = port
    this.cron = cron
    this.jwt_key = key
  }

  public async init() {
    app.use(express.json())

    app.get('/', async (req: Request, res: Response) => {
      res.status(ECODE.GOOD).json({ msg: 'ni hao ma' })
    })
    // secrect+password@#$
    app.post('/login', async (req: Request, res: Response) => {
      try {
        const { username, password } = req.body

        // Validate input
        if (!username || !password) {
          res.status(ECODE.ERROR).json({
            status: STATUS.GOOD,
            msg: 'Invalid username or password',
          })
          return
        }

        const result: Resp = await this.cron.login(username, password)

        if (result.status === STATUS.FAIL) {
          res.status(ECODE.ERROR).json({
            statuss: STATUS.FAIL,
            msg: result.res,
          })
          return
        }

        res.status(ECODE.GOOD).json({
          status: STATUS.GOOD,
          token:
            'Bearer ' + jwt.sign({ username }, this.jwt_key, { expiresIn: 30 }),
        })
      } catch (error: any) {
        res.status(ECODE.ERROR).json({
          status: ECODE.ERROR,
          msg: 'Internal server error...',
        })
      }
    })

    app.get('/items/:status?', async (req: Request, res: Response) => {
      const status: number = Number(req.params.status)
      try {
        if (!status) {
          res.status(ECODE.ERROR).json({
            status: STATUS.FAIL,
            msg: 'Invalid status',
          })
          return
        }

        const items = await this.cron.selectItem(status)
        res.status(ECODE.GOOD).json({
          status: STATUS.GOOD,
          items,
        })
      } catch (error: any) {
        res.status(ECODE.ERROR).json({
          status: error.status,
          message: error.res,
        })
      }
    })

    app.post('/order', async (req: Request, res: Response) => {
      try {
        const tableId: number = req.body.table_id
        const orders: any[] = req.body.orders

        if (!tableId || !orders) {
          res
            .status(ECODE.ERROR)
            .json({ status: STATUS.FAIL, msg: 'Invalid params' })
        }

        const result = await this.cron.order(tableId, orders)
        res.status(ECODE.GOOD).json(result)
      } catch (error: any) {
        res.status(ECODE.ERROR).json({
          status: error.status,
          message: error.res,
        })
      }
    })

    app.listen(this.port, () => {
      console.log(`Service is running on http://192.168.100.14:${this.port}/`)
    })
  }
}
