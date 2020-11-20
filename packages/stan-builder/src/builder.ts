import path from 'path';
import fs from 'fs';
import { chalk, chokidar, copyFiles, lodash as _, relativeNormalize, rimraf } from 'stan-utils';

import getStanConfig from './get-stan-config';
import babel from './_babel';
import rollup from './_rollup';
import { getExistFile } from './utils';
import { BuildOptions, BundleOptions, BaseBundleOptions } from './types';
import validOptions from './valid-options';

export function getBundleOpts(opts: BuildOptions): BundleOptions[] {
  const { cwd, args = {} } = opts;
  const entry = getExistFile({
    cwd,
    files: ['src/index.tsx', 'src/index.ts', 'src/index.jsx', 'src/index.js'],
    returnRelative: true,
  });
  const bundleOpts = getStanConfig({ cwd });
  if (!bundleOpts.length) {
    return [_.merge({ entry }, args)];
  }
  return bundleOpts.map((stanConfig) => {
    const bundleOpts: BundleOptions = _.merge(
      {
        entry,
      },
      args,
      stanConfig,
    );
    return bundleOpts;
  });
}

async function builder(opts: BuildOptions) {
  const bundleOptions = getBundleOpts(opts);
  const { cwd, rootPath, watch, verbose } = opts;

  try {
    console.log(chalk.gray(`Clean up the lib,es,dist directory.`));
    rimraf.sync(path.join(cwd, 'dist'));
    rimraf.sync(path.join(cwd, 'es'));
    rimraf.sync(path.join(cwd, 'lib'));
  } catch (e) {}

  for (const bundleOpt of bundleOptions) {
    const { bundler = 'rollup', entry, esm, umd, cjs, system, copy } = bundleOpt;

    await validOptions.validateAsync(bundleOpt);

    const isBabel = (b: BundleOptions['esm'] | BundleOptions['cjs']) =>
      b === 'babel' || (b as BaseBundleOptions)?.bundler === 'babel' || bundler === 'babel';

    // bundle umd
    if (umd) {
      await rollup({ cwd, watch, type: 'umd', bundleOpt });
    }

    // bundle system
    if (system) {
      await rollup({ cwd, watch, type: 'system', bundleOpt });
    }

    // bundle esm
    if (esm) {
      if (isBabel(esm)) {
        await babel({ cwd, rootPath, watch, type: 'esm', bundleOpt });
      } else {
        await rollup({ cwd, watch, type: 'esm', bundleOpt });
      }
    }

    // bundle cjs
    if (cjs) {
      if (isBabel(esm)) {
        await babel({ cwd, rootPath, watch, type: 'cjs', bundleOpt });
      } else {
        await rollup({ cwd, watch, type: 'cjs', bundleOpt });
      }
    }

    // copy file
    if (copy) {
      if (!_.has(copy, 'verbose')) {
        copy.verbose = verbose;
      }
      await copyFiles(copy);
      if (watch && copy.targets) {
        const targets = Array.isArray(copy.targets) ? copy.targets : [copy.targets];
        const watcher = chokidar.watch(_.flatten(targets.map((v) => v.src)), {
          ignoreInitial: true,
        });

        const files: string[] = [];

        const copyChangeFile = () =>
          copyFiles({
            ...opts,
            targets: targets.map(({ src, ...o }) => ({ src: files, ...o })),
          });

        const debouncedCopyFiles = _.debounce(_.throttle(copyChangeFile, 500), 1000);

        watcher.on('all', (event, fullPath) => {
          const srcPath = path.parse(path.join(cwd, entry!)).dir;
          const relPath = fullPath.replace(srcPath, '');
          console.log(`[${event}] ${relativeNormalize(relPath)}`);
          if (!fs.existsSync(fullPath)) return;
          if (fs.statSync(fullPath).isFile()) {
            if (!files.includes(fullPath)) files.push(fullPath);
            debouncedCopyFiles();
          }
        });

        watcher.on('error', (error) => {
          console.error('Error:', error);
          console.error(error.stack);
        });

        process.on('SIGINT', () => {
          watcher.close();
        });
      }
    }
  }

  if (!watch) {
    console.log(chalk.cyan('Build complete.'));
  }
}

export default builder;
