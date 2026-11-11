import React from "react";
import { Composition } from "remotion";
import { StoryboardFilm } from "./compositions/StoryboardFilm";
import { FORMATS } from "./types/format";
import { FILMS, filmFrames } from "./rendering/films";

/**
 * Every composition is the same component fed a different storyboard.
 * Duration, resolution and frame rate are derived from the storyboard, so a
 * re-timed scene cannot leave a black tail behind.
 */
export const RemotionRoot: React.FC = () => (
  <>
    {FILMS.map((film) => {
      const format = FORMATS[film.storyboard.format];
      return (
        <Composition
          key={film.id}
          id={film.id}
          component={StoryboardFilm}
          defaultProps={{ storyboard: film.storyboard }}
          durationInFrames={filmFrames(film)}
          fps={format.fps}
          width={format.width}
          height={format.height}
        />
      );
    })}
  </>
);
