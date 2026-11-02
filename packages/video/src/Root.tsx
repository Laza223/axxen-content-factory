import {
  BrandKitSchema,
  FPS,
  HEIGHT,
  TEMPLATE_RULES,
  VideoSpecSchema,
  WIDTH,
  totalFrames,
  withEstimatedTimings,
} from "@axxen/core";
import type React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import brandJson from "../public/fixtures/hamburgueseria/brand.json";
import packJson from "../public/fixtures/hamburgueseria/pack.json";
import { BackgroundPreview } from "./library/BackgroundPreview";
import { PackVideo, type PackVideoProps } from "./PackVideo";

const fixtureBrand = BrandKitSchema.parse(brandJson);
const fixturePack = packJson.map((s) => VideoSpecSchema.parse(s));

/** Duration comes from the spec; missing word timings are estimated so captions always play. */
export const calculatePackMetadata: CalculateMetadataFunction<PackVideoProps> = ({ props }) => {
  const spec = withEstimatedTimings(VideoSpecSchema.parse(props.spec));
  const brand = BrandKitSchema.parse(props.brand);
  return { durationInFrames: totalFrames(spec), props: { ...props, brand, spec } };
};

export const RemotionRoot: React.FC = () => (
  <>
    {/* Generic entry point used by the worker: pass any { brand, spec } as input props. */}
    <Composition
      id="PackVideo"
      component={PackVideo}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={totalFrames(fixturePack[0]!)}
      defaultProps={{ brand: fixtureBrand, spec: fixturePack[0]!, preview: false }}
      calculateMetadata={calculatePackMetadata}
    />
    {/* Library check: one background, full screen, with the fixture palette. */}
    <Composition
      id="BackgroundPreview"
      component={BackgroundPreview}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={90}
      defaultProps={{ brand: fixtureBrand, backgroundId: "brand-aurora" }}
    />
    {/* One composition per template with the fixture brand, for the Studio. */}
    {fixturePack.map((spec) => (
      <Composition
        key={spec.id}
        id={`${spec.template}`}
        component={PackVideo}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        durationInFrames={totalFrames(spec)}
        defaultProps={{ brand: fixtureBrand, spec, preview: false }}
        calculateMetadata={calculatePackMetadata}
      />
    ))}
  </>
);

export { TEMPLATE_RULES };
