'use strict';


const BbPromise = require('bluebird');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {

    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file));

  });
return filelist;
}

class Deploy {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.hooks = {
      'after:deploy:deploy': this.upload,
      'site:upload:upload': () => BbPromise.bind(this)
        .then(this.upload)
    };

    this.commands = {
      "site": {
        commands: {
          upload: {
            usage: 'Serve the WSGI application locally.',
            lifecycleEvents: [
              'upload',
            ],
          },
        },
      },
    };

  }

  upload() {
    const self = this;
    const s3 = new AWS.S3(); 
    const dirName = self.serverless.service.custom.site_dir;
    const bucketName = self.serverless.service.custom.site_bucket;
    if (!dirName || !bucketName){
      self.serverless.cli.log("define site_dir and site_bucket in custom")
      return;
    }
    const files = walkSync(dirName);
    files.forEach(file => {
      fs.readFile(file, function(err, data) {
        if (err) throw err;
        const params = {Bucket: bucketName, Key: file, Body: data, ContentType:mime.lookup(file)  };
        s3.putObject(params, function(err, data) {
            if (err){
                self.serverless.cli.log(err)
            }     
            else{
                self.serverless.cli.log("Successfully uploaded to " + path.join(bucketName, dirName, file));   
            }
         });
      });
    })
  };
}

module.exports = Deploy;