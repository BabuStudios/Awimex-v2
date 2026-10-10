"use client";
"use no memo"; // Frame-loop component: toggles scene visibility every frame.

/**
 * One group per scene at z = sceneZ(index). A scene renders only while the
 * camera is within reach of it — beyond FOG_FAR it is invisible anyway, so
 * culling it saves the GPU without changing a pixel.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { SCENE_SPACING, scenes } from "@/content/content";
import { useI18n } from "@/lib/i18n-context";
import { sceneZ } from "@/engine/scroll/timeline";
import { InSceneWord } from "@/engine/text/InSceneWord";
import { sceneContents } from "./contents";

const REACH = SCENE_SPACING * 1.25;

export function Scenes() {
  const { dict } = useI18n();
  const groups = useRef<(Group | null)[]>([]);

  useFrame(({ camera }) => {
    groups.current.forEach((g, i) => {
      if (g) g.visible = Math.abs(camera.position.z - sceneZ(i)) < REACH;
    });
  });

  return (
    <>
      {scenes.map((scene, i) => {
        const Content = sceneContents[scene.id];
        return (
          <group
            key={scene.id}
            ref={(g) => {
              groups.current[i] = g;
            }}
            position={[0, 0, sceneZ(i)]}
          >
            {scene.inSceneWord && (
              <InSceneWord word={dict.inScene[scene.inSceneWord]} width={34} position={[0, 11.5, -30]} />
            )}
            {Content && <Content index={i} />}
          </group>
        );
      })}
    </>
  );
}
