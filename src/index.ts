import * as dotenv from "dotenv";
dotenv.config();

import "global-agent/bootstrap";
import bot from "./bot";
import { startServer } from "./server";

bot.start();
startServer();
