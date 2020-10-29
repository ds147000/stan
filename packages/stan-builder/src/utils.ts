import { join, dirname } from 'path';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import type { CompilerOptions } from 'typescript';

export function getExistFile({
  cwd,
  files,
  returnRelative,
}: {
  cwd: string;
  files: string[];
  returnRelative?: boolean;
}): string | void {
  for (const file of files) {
    const absFilePath = join(cwd, file);
    if (existsSync(absFilePath)) {
      return returnRelative ? file : absFilePath;
    }
  }
}

export function tryDefault(obj: any) {
  return obj.default || obj;
}

/**
 * Parses values of the form "$=jQuery,React=react" into key-value object.
 */
export function parseMappingArgument(
  globalStrings: string,
  processValue?: (v: string, k: string) => string[] | string | void,
) {
  const globals = {};
  globalStrings.split(',').forEach((globalString) => {
    let [key, value] = globalString.split('=');
    if (processValue) {
      const r = processValue(value, key);
      if (r !== undefined) {
        if (Array.isArray(r)) {
          [value, key] = r;
        } else {
          value = r;
        }
      }
    }
    globals[key] = value;
  });
  return globals;
}

export function getTsConfigPath(cwd: string, rootPath?: string): string {
  const tsconfigPath = path.join(cwd, 'tsconfig.json');
  const templateTsconfigPath = path.join(__dirname, '../template/tsconfig.json');
  try {
    if (existsSync(tsconfigPath)) {
      return tsconfigPath;
    }
    if (rootPath && existsSync(path.join(rootPath, 'tsconfig.json'))) {
      return path.join(rootPath, 'tsconfig.json');
    }
  } catch (e) {}
  return templateTsconfigPath;
}

/**
 * parsed tsconfig
 */
export function getParsedTSConfig(cwd: string, rootPath?: string): CompilerOptions {
  try {
    function parseTsconfig(path: string): CompilerOptions | void {
      const {
        readConfigFile,
        sys,
        formatDiagnostic,
        parseJsonConfigFileContent,
      } = require('typescript');
      const result = readConfigFile(path, sys.readFile);

      const formatDiagnosticHost = {
        getCanonicalFileName: (fileName: string) => fileName,
        getCurrentDirectory: sys.getCurrentDirectory,
        getNewLine: () => os.EOL,
      };
      if (result?.error) {
        console.log(formatDiagnostic(result.error, formatDiagnosticHost));
        return;
      }
      const parsed = parseJsonConfigFileContent(
        result.config,
        {
          useCaseSensitiveFileNames: false,
          readDirectory: sys.readDirectory,
          fileExists: sys.fileExists,
          readFile: sys.readFile,
        },
        dirname(path),
      );
      if (parsed?.errors?.length) {
        console.log(formatDiagnostic(parsed?.errors?.[0], formatDiagnosticHost));
        return;
      }
      return parsed.options;
    }

    function getTsconfigCompilerOptions(path: string) {
      const config = parseTsconfig(path);
      return config || undefined;
    }

    return getTsconfigCompilerOptions(getTsConfigPath(cwd, rootPath)) || {};
  } catch (e) {
    return {};
  }
}
