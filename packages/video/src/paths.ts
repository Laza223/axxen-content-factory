// Node-only: where the Remotion entry point and the public dir live, for bundling/rendering.
import { fileURLToPath } from "node:url";

export const VIDEO_ENTRY = fileURLToPath(new URL("./index.ts", import.meta.url));
export const VIDEO_PUBLIC_DIR = fileURLToPath(new URL("../public", import.meta.url));
