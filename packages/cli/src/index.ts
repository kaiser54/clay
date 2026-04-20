#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { generateMockData } from "@clay/core";
import { startServer } from "@clay/server";

const program = new Command();

program
  .name("clay")
  .description("TypeScript interface → realistic mock JSON data")
  .version("0.1.0");

program
  .command("generate <file>")
  .description("Generate mock data from a TypeScript file")
  .option("-c, --count <number>", "number of records to generate", "10")
  .option("-s, --seed <number>", "seed for deterministic output")
  .option("-o, --out <file>", "write output to a file instead of stdout")
  .action((file: string, opts: { count: string; seed?: string; out?: string }) => {
    const filePath = resolve(process.cwd(), file);
    let sourceCode: string;

    try {
      sourceCode = readFileSync(filePath, "utf-8");
    } catch {
      console.error(`Error: could not read file "${filePath}"`);
      process.exit(1);
    }

    const count = parseInt(opts.count, 10);
    const seed = opts.seed !== undefined ? parseInt(opts.seed, 10) : undefined;

    let result: Record<string, unknown>[];
    try {
      result = generateMockData(sourceCode, { count, seed });
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }

    const output = JSON.stringify(result, null, 2);

    if (opts.out) {
      const outPath = resolve(process.cwd(), opts.out);
      writeFileSync(outPath, output, "utf-8");
      console.log(`Wrote ${count} records to ${outPath}`);
    } else {
      console.log(output);
    }
  });

program
  .command("serve <file>")
  .description("Start a local mock API server from a TypeScript file")
  .option("-p, --port <number>", "port to listen on", "3000")
  .option("-c, --count <number>", "number of records per resource", "10")
  .option("-s, --seed <number>", "seed for deterministic output")
  .action((file: string, opts: { port: string; count: string; seed?: string }) => {
    const filePath = resolve(process.cwd(), file);
    let sourceCode: string;

    try {
      sourceCode = readFileSync(filePath, "utf-8");
    } catch {
      console.error(`Error: could not read file "${filePath}"`);
      process.exit(1);
    }

    try {
      startServer({
        sourceCode,
        port: parseInt(opts.port, 10),
        count: parseInt(opts.count, 10),
        seed: opts.seed !== undefined ? parseInt(opts.seed, 10) : undefined,
      });
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
