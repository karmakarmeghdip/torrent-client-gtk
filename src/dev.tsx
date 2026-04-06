import pkg from "../package.json" with { type: "json" };

// biome-ignore lint/style/noDefaultExport: GTKX framework requires default export
export { App as default } from "./app.js";

export const appId = pkg.gtkx.appId;
