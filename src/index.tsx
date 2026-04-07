import { render } from "@gtkx/react";
import pkg from "../package.json" with { type: "json" };
import { App } from "./app.js";
import { logger } from "./utils/logger.js";

logger.info("Starting Torrent Client GTK");
render(<App />, pkg.gtkx.appId);
