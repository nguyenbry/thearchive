import fs from "node:fs";
import path from "node:path";

export function findAbsolutePath(filename: string, maxDepth = 10) {
  let iteration = 0;
  while (iteration < maxDepth) {
    const slashDotDot = Array.from({ length: iteration + 1 }, () => "/..").join(
      "",
    );

    // eslint-disable-next-line unicorn/prefer-module
    const relativePathGuess = `${__dirname}${slashDotDot}/${filename}`;
    if (fs.existsSync(relativePathGuess))
      return path.resolve(relativePathGuess);

    iteration++;
  }

  throw new Error(`${filename} not found`);
}
