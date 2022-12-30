#! /bin/bash

rm -rf ../../lib/cloudapi-client
mkdir -p ../../lib/cloudapi-client
openapi-generator generate -g typescript-axios -i https://raw.githubusercontent.com/bugitt/cloudapi/main/openapi/cloudapi_v2.yaml -o ./tmp
cp ./tmp/*.ts ../../lib/cloudapi-client/
rm -rf ./tmp
