import { Cron } from './cron.js'
import dotenv from 'dotenv'
import { API } from './api.js'

dotenv.config()

class Service {
     private readonly Cron: Cron
     private readonly dbConn: string
     private readonly port: string
     private readonly API: API
     private readonly JWT_KEY: string
     private readonly HOST: string

     constructor() {
          this.dbConn = process.env.DATABASE_URL || 'local'
          this.port = process.env.PORT || '8001'
          this.Cron = new Cron(this.dbConn)
          this.JWT_KEY = process.env.JWT_KEY || ''
          this.HOST = process.env.HOST || ''
          this.API = new API(this.port, this.Cron, this.JWT_KEY, this.HOST)
     }

     public async init() {
          try {
               console.log('Service init')
               await this.API.init()
               await this.start()
          } catch (error) {
               console.log(error)
               throw error
          }
     }

     public async start() {
          try {
               console.log('Service start ..')
          } catch (error) {
               console.log(`Error during start: ${error}`)
               throw error
          }
     }

     public async term() {
          try {
               await this.Cron.closeMysqlConnection()
               this.Cron.log('Service termination ...')
          } catch (error) {
               console.log(`Error during termination: ${error}`)
          }
     }
}

const service = new Service()
try {
     await service.init()
} catch (error) {
     await service.term()
     console.error(`Service failed to initialize: ${error}`)
     process.exit(1)
}

process.on('SIGINT', async () => {
     await service.term()
     process.exit(0)
})
