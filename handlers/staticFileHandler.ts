import {
  join,
  normalize,
  common,
} from "https://deno.land/std@0.133.0/path/mod.ts";
import { readableStreamFromReader } from "https://deno.land/std@0.133.0/streams/mod.ts";

export interface StaticFileHandlerOptions {
  rootDir: string;
}

export function staticFileHandler<Context>(options: StaticFileHandlerOptions) {
  return async (
    context: Context,
    [method, [prefix, filePath]]: [string, [string, string]]
  ) => {
    const normalizedFilePath = normalize(join(options.rootDir, filePath));
    const commonPath = common([options.rootDir, normalizedFilePath]);
    if (!commonPath.startsWith(options.rootDir)) {
      return new Response("", {
        status: 403,
      });
    }

    try {
      let file = await Deno.open(normalizedFilePath, { read: true });
      const stat = await file.stat();
      if (stat.isDirectory) {
        file.close();
        const filePath = join(normalizedFilePath, "index.html");
        file = await Deno.open(filePath, { read: true });
      }
      const readableStream = readableStreamFromReader(file);

      return new Response(readableStream);
    } catch {
      return new Response("", { status: 404 });
    }
  };
}
