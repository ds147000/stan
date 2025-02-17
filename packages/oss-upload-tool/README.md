# `oss-upload-tool`

> Integrated oss upload   
> Complete integration [COS](https://cloud.tencent.com/document/product/436/6474) / [ALI-OSS](https://help.aliyun.com/document_detail/32068.htm?spm=a2c4g.11186623.0.0.3e8ff2eeVjYbKz#concept-32068-zh), Welcome to improve together.

## Install

Using npm:

```console
npm install oss-upload-tool --save-dev
```

Using yarn:

```console
yarn add oss-upload-tool -D
```


## Usage

The tool will prioritize the identification of environment variables for easy invocation.   
Before use, please register environment variables in advance to facilitate use. In CI/Action, you can set environment variables to prevent exposure of OSS parameters.
```shell
npm config set oss_upload_tool_secret_id "your secret_id"
npm config get oss_upload_tool_secret_key "your secret_key"
```
There are environment variables that have been downloaded.
```shell
# General parameters
npm config get oss_upload_tool_secret_id
npm config get oss_upload_tool_secret_key
npm config get oss_upload_tool_bucket
npm config get oss_upload_tool_region
# COS
npm config get oss_upload_tool_cos_secret_id
npm config get oss_upload_tool_cos_secret_key
npm config get oss_upload_tool_cos_bucket
npm config get oss_upload_tool_cos_region
# Ali-oss
npm config get oss_upload_tool_alioss_secret_id
npm config get oss_upload_tool_alioss_secret_key
npm config get oss_upload_tool_alioss_bucket
npm config get oss_upload_tool_alioss_region
npm config get oss_upload_tool_alioss_endpoint
```
Get parameter priority `parameters` > `process.env.[key]` > `npm config get [key]`.

### Usage in CLI

```shell
oss -t "./lib/**" -d "./__xxx","__xxx1/" --bucket "***" --region "***"
```

### Usage in Node
```ts
const ossUpload = require('oss-upload-tool');

// upload cos
await ossUpload({
  targets: {
    src: './lib/**/*',
    dest: ['__xxx/', '__xxx1/'],
  },
  uploadParams: {
    Bucket: '***',
    Region: '***',
  },
  COSOptions: {
    SecretId: '***',
    SecretKey: '***',
  },
});

// upload ali-oss
await ossUpload({
  targets: {
    src: './lib/**/*',
    dest: ['__xxx/', '__xxx1/'],
  },
  AOSSOptions: {
    accessKeyId: '***',
    accessKeySecret: '***',
    bucket: '***',
    region: '***',
    endpoint: '***',
  },
});
```

## Options

#### targets

Upload configuration

* Type: `array | object`
  * src: `string | string[]` [globby](https://www.npmjs.com/package/globby) patterns.
  * dest: `string | string[]` Upload path, If it is an array, it will upload to multiple directories.
  * flatten: `bool` Delete the directory structure of uploaded files.
  * rename: `string | (path: string, ext: string) => string` Uploaded file name.
  * transform: `(Buffer) => Buffer | string` Upload file content.

#### type
* Type: `COS | AOSS` default `COS`

### uploadParams
* COS `import('cos-nodejs-sdk-v5').SliceUploadFileParams`
* AOSS `import('ali-oss').PutObjectOptions`

#### COSOptions
* Type: `object` https://github.com/tencentyun/cos-nodejs-sdk-v5

#### AOSSOptions
* Type: `object` https://github.com/ali-sdk/ali-oss#node-usage 

#### parallelLimit
* Type: `number` default 3

Number of parallel uploads

#### cwd
* Type: `string` default `process.cwd()`
