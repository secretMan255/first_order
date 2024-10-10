import { Cron } from "./cron.js";
import dotenv from "dotenv";
import { API } from "./api.js";
dotenv.config();
class Service {
    constructor() {
        this.dbConn = process.env.DATABASE_URL || "local";
        this.port = process.env.PORT || "8001";
        this.Cron = new Cron(this.dbConn);
        this.JWT_KEY = process.env.JWT_KEY || "";
        this.API = new API(this.port, this.Cron, this.JWT_KEY);
    }
    async init() {
        try {
            console.log("Service init");
            await this.API.init();
            await this.start();
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async start() {
        try {
            console.log("Service start ..");
        }
        catch (error) {
            console.log(`Error during start: ${error}`);
            throw error;
        }
    }
    async term() {
        try {
            await this.Cron.closeMysqlConnection();
            this.Cron.log("Service termination ...");
        }
        catch (error) {
            console.log(`Error during termination: ${error}`);
        }
    }
}
const service = new Service();
try {
    await service.init();
}
catch (error) {
    await service.term();
    console.error(`Service failed to initialize: ${error}`);
    process.exit(1);
}
process.on("SIGINT", async () => {
    await service.term();
    process.exit(0);
});
