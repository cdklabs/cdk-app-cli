import * as cp from "child_process";
import * as util from "util";
import chalk from "chalk";

const MAX_BUFFER = 10 * 1024 * 1024;

const DEBUG = process.env.DEBUG;

export function fail(e: Error): never {
  error(e.message);
  log(e.stack ?? "No stack trace.");
  process.exit(1);
}

export function error(message: any) {
  console.error(chalk.red(`[cdk-app] Error: ${message}`));
}

export function log(message: any) {
  if (DEBUG) {
    if (typeof message === "string") {
      console.error(chalk.white(`[cdk-app] ${message}`));
    } else {
      console.error(chalk.white(`[cdk-app] ${util.inspect(message)}`));
    }
  }
}

/**
 * Executes a command with STDOUT > STDERR.
 */
export function exec(command: string, options: { cwd: string }): void {
  try {
    cp.execSync(command, {
      stdio: ["inherit", process.stderr, "pipe"], // "pipe" for STDERR means it appears in exceptions
      maxBuffer: MAX_BUFFER,
      cwd: options.cwd,
    });
  } catch (e) {
    fail(e as Error);
  }
}

/**
 * Executes command and returns STDOUT. If the command fails (non-zero), throws an error.
 */
export function execCapture(command: string, options: { cwd: string }) {
  try {
    return cp.execSync(command, {
      stdio: ["inherit", "pipe", "pipe"], // "pipe" for STDERR means it appears in exceptions
      maxBuffer: MAX_BUFFER,
      cwd: options.cwd,
    });
  } catch (e) {
    fail(e as Error);
  }
}

type Obj = { [key: string]: any };

function isObj(value: any): value is Obj {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

export function deepMerge(target: any, source: any) {
  let output = Object.assign({}, target);
  if (isObj(target) && isObj(source)) {
    Object.keys(source).forEach((key) => {
      if (isObj(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

export type Condition<T> = (key: string, value: any) => value is T;

/**
 * Given a JSON object and a matching function, find the section of
 * JSON satisfying the condition if there is one.
 */
export function tryFindByPredicate<T>(
  json: any,
  condition: Condition<T>
): { key: string; value: T } | undefined {
  if (!isObj(json)) {
    return undefined;
  }

  for (const [key, value] of Object.entries(json)) {
    if (isObj(value) && condition(key, value)) {
      return { key, value };
    }

    const resource = tryFindByPredicate(value, condition);
    if (resource) {
      return resource;
    }
  }

  return undefined;
}
