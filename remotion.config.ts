/**
 * Studio render defaults.
 *
 * These apply to the CLI and Studio only. The programmatic renderer in
 * src/rendering/ passes the same values explicitly, because the Node APIs do
 * not read this file.
 */
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setOverwriteOutput(true);

/**
 * Frames are captured as JPEG for speed, but at a quality high enough that the
 * film's large dark gradient fields do not band. At the default 80 the navy
 * field shows visible blocking; 98 is indistinguishable from PNG here and
 * roughly three times faster to encode.
 */
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(98);

/** Scene media is decoded ahead of its sequence so a cut never lands on a gap. */
Config.setDefaultPremountInSeconds(1);

Config.setConcurrency(6);
