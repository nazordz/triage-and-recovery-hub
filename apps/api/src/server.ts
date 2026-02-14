import "dotenv/config";
import express, { Express } from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app: Express = express();
const port = "8000";

app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "50mb",
  })
);
app.use(express.json());

app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}`);
});