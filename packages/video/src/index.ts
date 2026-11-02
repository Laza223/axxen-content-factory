import { registerRoot } from "remotion";
import { loadAllFonts } from "./fonts";
import { RemotionRoot } from "./Root";

loadAllFonts();
registerRoot(RemotionRoot);
