import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "@gtkx/cli/builder";
import type { Plugin } from "vite";

const require = createRequire(import.meta.url);

/**
 * Vite plugin that handles native .node modules by copying them to the output
 * directory and rewriting the import paths.
 */
function nativeNodePlugin(): Plugin {
  const nodeModulesToHandle = [
    {
      name: "node-datachannel",
      nodePath: "build/Release/node_datachannel.node",
      outputName: "node_datachannel.node",
    },
  ];

  return {
    name: "native-node-modules",
    enforce: "pre",
    buildStart() {
      // Copy native .node files to output directory
      for (const mod of nodeModulesToHandle) {
        try {
          const packagePath = require.resolve(`${mod.name}/package.json`);
          const packageDir = packagePath.replace("/package.json", "");
          const sourcePath = resolve(packageDir, mod.nodePath);
          const source = readFileSync(sourcePath);
          this.emitFile({
            type: "asset",
            fileName: mod.outputName,
            source,
          });
        } catch {
          // Silently skip if module not found
        }
      }
    },
    transform(code: string, id: string) {
      // Rewrite require statements to point to the correct location
      for (const mod of nodeModulesToHandle) {
        if (id.includes(mod.name) && code.includes("node_datachannel.node")) {
          // Replace the relative path with a path relative to the bundle
          // Match: require("../../../build/Release/node_datachannel.node")
          const pattern =
            /require\("\.\.\/\.\.\/\.\.\/(build\/Release\/node_datachannel\.node)"\)/g;
          const transformed = code.replace(pattern, 'require("../node_datachannel.node")');
          if (transformed !== code) {
            return transformed;
          }
        }
      }
      return null;
    },
  };
}

async function main() {
  const entry = resolve(process.cwd(), "src/index.tsx");
  // biome-ignore lint/suspicious/noConsole: Build script needs console output
  console.log(`[gtkx] Building ${entry}`);

  await build({
    entry,
    vite: {
      root: process.cwd(),
      plugins: [nativeNodePlugin()],
    },
  });

  // biome-ignore lint/suspicious/noConsole: Build script needs console output
  console.log("[gtkx] Build complete: dist/bundle.js");
}

main().catch((error) => {
  // biome-ignore lint/suspicious/noConsole: Build script needs error logging
  console.error("[gtkx] Build failed:", error);
  process.exit(1);
});
