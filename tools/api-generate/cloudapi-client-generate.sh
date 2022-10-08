#! /bin/bash

rm -rf ../../src/cloudapi-client
mkdir -p ../../src/cloudapi-client
openapi-generator generate -g typescript-axios -i https://raw.githubusercontent.com/bugitt/cloudapi/main/openapi/cloudapi_v2.yaml -o ./tmp
cp ./tmp/*.ts ../../src/cloudapi-client/
rm -rf ./tmp
