import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { camerasRouter } from "./routes/cameras";
import { reportsRouter } from "./routes/reports";
import { routesRouter } from "./routes/routes";
import { logger } from "hono/logger";

export const app = new Hono();

const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

app.use("*", logger());

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/cameras", camerasRouter);
app.route("/api/reports", reportsRouter);
app.route("/api/routes", routesRouter);

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
