import { commander } from 'stan-utils';
import { OSSUploadOptions } from '../types';
import { BUCKET_KEY, REGION_KEY, SECRET_ID, SECRET_KEY } from '../consts';

const pkg = require('../../package.json');

commander.option('-V, --verbose', 'Output verbose messages on internal operations');
commander.option('--oss [COS|AOSS]', 'OSS Type only supported COS|AOSS');
commander.option('-t, --targets <list>', 'Upload targets local path', collect);
commander.option('-d, --dest <list>', 'Upload remote directory', collect);
commander.option('--flatten', 'Delete the directory structure of uploaded files', booleanify);
commander.option('--secret_id [string]', 'OSS SecretId params');
commander.option('--secret_key [string]', 'OSS SecretKey params');
commander.option('--bucket [string]', 'OSS Bucket params');
commander.option('--region [string]', 'OSS Region params');

commander.version(pkg.version);

export default function parseArgv(args: string[]): OSSUploadOptions | void {
  commander.parse(args);

  if (commander.args.length) {
    commander.outputHelp();
    return;
  }

  const errors: string[] = [];

  if (errors.length) {
    console.error(`${pkg.name}:`);
    errors.forEach(function (e) {
      console.error('  ' + e);
    });
    return;
  }

  const opts = commander.opts();

  const { secret_id, secret_key, bucket, region } = opts;

  // setup env
  process.env[SECRET_ID] = secret_id;
  process.env[SECRET_KEY] = secret_key;
  process.env[BUCKET_KEY] = bucket;
  process.env[REGION_KEY] = region;

  return {
    cwd: process.cwd(),
    verbose: !!opts.verbose,
    type: opts.oss,
    targets: (opts?.targets || []).filter(Boolean).map((src: string) => {
      return {
        src,
        dest: opts.dest,
        flatten: opts.flatten,
      };
    }),
  };
}

function collect(value: string | any, previousValue: Array<string>): Array<string> {
  if (typeof value !== 'string') return previousValue;

  const values = value.split(',');

  return previousValue ? previousValue.concat(values) : values;
}

function booleanify(val: any): boolean | any {
  // eslint-disable-next-line eqeqeq
  if (val === 'true' || val == 1) {
    return true;
  }

  // eslint-disable-next-line eqeqeq
  if (val === 'false' || val == 0 || !val) {
    return false;
  }

  return val;
}
