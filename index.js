const express = require('express');
const AWS = require('aws-sdk');
const path = require('path');

const app = express();

const getItem = (path, head = false) => new Promise((resolve, reject) => {
    const pathParts = path.split('');

    let getPath;

    if (pathParts.shift() === '/') {
        getPath = pathParts.join('');
    } else {
        getPath = path;
    }

    s3[head ? 'headObject' : 'getObject']({
        Bucket: process.env.BUCKET,
        Key: getPath
    }, (error, res) => error ? reject(error) : resolve(res));
});

const s3 = new AWS.S3({
    signatureVersion: 'v4'
});

app.get('*', async (req, res) => {
    let reqPath = decodeURIComponent(req.path);

    try {
        const item = await getItem(reqPath);

        res.type(item.ContentType).end(item.Body);
    } catch (error) {
        try {
            const indexPath = path.join(reqPath, 'index.html');

            if (await getItem(indexPath, true)) {
                res.redirect(indexPath);
            } else {
                res.status(404).end();
            }
        } catch (indexError) {
            res.status(400).end();
        }
    }
});

app.listen(80);