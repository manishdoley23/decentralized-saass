import https from "https";
import { HttpRequest } from "@smithy/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@smithy/url-parser";
import { formatUrl } from "@aws-sdk/util-format-url";
import { Hash } from "@smithy/hash-node";
import { S3_ACCESS_KEY, S3_SECRET_KEY } from "./config";

export const createPresignedUrlWithoutClient = async ({
    region,
    bucket,
    key,
}: {
    region: string;
    bucket: string;
    key: string;
}) => {
    const url = parseUrl(`https://${bucket}.s3.${region}.amazonaws.com/${key}`);
    const presigner = new S3RequestPresigner({
        credentials: {
            accessKeyId: S3_ACCESS_KEY,
            secretAccessKey: S3_SECRET_KEY,
        },
        region,
        sha256: Hash.bind(null, "sha256"),
    });

    const signedUrlObject = await presigner.presign(
        new HttpRequest({ ...url, method: "PUT" })
    );
    return formatUrl(signedUrlObject);
};
