import type React from "react";
import type { Scene, SceneKind } from "../types/storyboard";
import { StatementScene } from "./StatementScene";
import { BrandRevealScene } from "./BrandRevealScene";
import { UIWalkthroughScene } from "./UIWalkthroughScene";
import { FeatureMontageScene } from "./FeatureMontageScene";
import { ApiBeatScene } from "./ApiBeatScene";
import { ChatDemoScene } from "./ChatDemoScene";
import { StatBeatScene } from "./StatBeatScene";
import { AudienceGridScene } from "./AudienceGridScene";
import { ClosingScene } from "./ClosingScene";

/**
 * Scene registry.
 *
 * Adding a scene kind means adding it to the storyboard schema and to this
 * map; nothing else in the pipeline needs to change.
 */
type SceneComponents = {
  [K in SceneKind]: React.FC<{ scene: Extract<Scene, { kind: K }> }>;
};

export const SCENES: SceneComponents = {
  statement: StatementScene,
  brandReveal: BrandRevealScene,
  uiWalkthrough: UIWalkthroughScene,
  featureMontage: FeatureMontageScene,
  apiBeat: ApiBeatScene,
  chatDemo: ChatDemoScene,
  statBeat: StatBeatScene,
  audienceGrid: AudienceGridScene,
  closing: ClosingScene,
};

export const renderScene = (scene: Scene): React.ReactElement => {
  switch (scene.kind) {
    case "statement":
      return <SCENES.statement scene={scene} />;
    case "brandReveal":
      return <SCENES.brandReveal scene={scene} />;
    case "uiWalkthrough":
      return <SCENES.uiWalkthrough scene={scene} />;
    case "featureMontage":
      return <SCENES.featureMontage scene={scene} />;
    case "apiBeat":
      return <SCENES.apiBeat scene={scene} />;
    case "chatDemo":
      return <SCENES.chatDemo scene={scene} />;
    case "statBeat":
      return <SCENES.statBeat scene={scene} />;
    case "audienceGrid":
      return <SCENES.audienceGrid scene={scene} />;
    case "closing":
      return <SCENES.closing scene={scene} />;
  }
};
