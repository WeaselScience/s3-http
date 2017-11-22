const express = require('express');
const AWS = require('aws-sdk');
const path = require('path');

const app = express();

const getItem = (path, head = false) => new Promise((resolve, reject) => {
    const pathParts = path.split('');

    if (pathParts[0] === '/') {
        pathParts.shift();
    }
    
    if (pathParts[pathParts.length - 1] === '/') {
        pathParts.pop();
    }
    
    const getPath = pathParts.join('');

    s3[head ? 'headObject' : 'getObject']({
        Bucket: process.env.BUCKET,
        Key: getPath
    }, (error, res) => {
        if (error) {
            return reject(error);
        }
        
        if (res && !res.ContentLength) { // directory or empty file
            return reject();
        }
        
        resolve(res);
    });
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
        const indexPath = path.join(reqPath, 'index.html');
        
        try {
            await getItem(indexPath, true); // Will fail if item is missing
            res.redirect(indexPath);
        } catch (error) {
            res.status(404).end();
        }
    }
});

app.listen(80);