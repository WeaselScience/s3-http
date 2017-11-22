const express = require('express');
const AWS = require('aws-sdk');
const path = require('path');

const app = express();

const getItem = (path) => new Promise((resolve, reject) => {
    const pathParts = path.split('');

    let getPath;

    if (pathParts.shift() === '/') {
        getPath = pathParts.join('');
    } else {
        getPath = path;
    }

    s3.getObject({
        Bucket: process.env.BUCKET,
        Key: getPath
    }, (error, res) => error ? reject(error) : resolve(res));
});

const s3 = new AWS.S3({
    signatureVersion: 'v4'
});

app.get('*', async (req, res) => {
    let reqPath = req.path;

    let item;
    
    try {
        item = await getItem(reqPath);
    } catch (error) {
        // Base request path not found
    }
    
    if (!item) {
        const indexPath = path.join(reqPath, 'index.html');
        
        try {
            item = await getItem(indexPath);
        } catch (error) {
            // Index is not found either
        }
    }
    
    if (!item) {
        res.status(404).end();
    } else {
        res.type(item.ContentType).end(item.Body);
    }
});

app.listen(80);