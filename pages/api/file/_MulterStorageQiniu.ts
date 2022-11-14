// var path = require( 'path' );
// var crypto = require( 'crypto' );
// var qiniu = require( 'qiniu' );
import crypto from 'crypto';
import path from 'path';
import qiniu from 'qiniu';

function getFilename( req, file, cb ) {
  crypto.pseudoRandomBytes( 16, function ( err, raw ) {
    cb( err, err ? undefined : raw.toString( 'hex' ) );
  });
}

function getDestination( req, file, cb ) {
  cb( null, '' );
}

function QNStorage( opts ) {
  this.getFilename = ( opts.filename || getFilename );
  if ( 'string' === typeof opts.destination ) {
    this.getDestination = function( $0, $1, cb ) { cb( null, opts.destination ); }
  } else {
    this.getDestination = ( opts.destination || getDestination );
  }

  if ( ! opts.config ) {
    throw new Error( 'You have to specify config for Qiniu Storage to work.' );
  }

  opts.bucket = ( opts.config.bucket || null );

  qiniu.conf.ACCESS_KEY = opts.config.ACCESS_KEY;
  qiniu.conf.SECRET_KEY = opts.config.SECRET_KEY;

  this.uploadFile = function (key, body, callback) {
    var mac = new qiniu.auth.digest.Mac(opts.config.ACCESS_KEY, opts.config.SECRET_KEY);
    var token = new qiniu.rs.PutPolicy({
      scope: opts.bucket,
      returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}'
    }).uploadToken(mac);
    var config = new qiniu.conf.Config({zone: qiniu.zone.Zone_z2});
    // 空间对应的机房
    // config.zone = qiniu.zone.Zone_z0;
    var formUploader = new qiniu.form_up.FormUploader(config);
    // var extra = new qiniu.io.PutExtra();
    var extra = new qiniu.form_up.PutExtra();
    formUploader.putStream(token, key, body, extra, function (err, ret) {
      console.log('putReadable',err, ret)
      callback(err, ret)
    });
  };

  this.deleteFile = function (obj, callback) {
    var client = new qiniu.rs.Client();
    client.remove(obj.Bucket, obj.Key, callback);
  };

  this.options = opts;
}

QNStorage.prototype._handleFile = function _handleFile( req, file, cb ) {
  var self = this;
  self.getDestination( req, file, function( err, destination ) {
    if ( err ) {
      return cb( err );
    }
    self.getFilename( req, file, function( err, filename ) {
      if ( err ) {
        return cb( err );
      }

      var finalPath = path.join( destination, filename ),
        Key = finalPath,
        Body= file.stream;

      self.uploadFile( Key, Body, function( err, data ) {
        if ( err ) {
          cb( err, data );
        } else {
          req.qiniuUploadPayload = data;
          cb( null, {
            destination: destination,
            filename   : filename,
            path       : finalPath
          });
        }
      });
    });
  });
};
  
QNStorage.prototype._removeFile = function _removeFile( req, file, cb ) {
  
  this.deleteFile({
    Bucket: this.bucket,
    Key   : file.path
  }, cb );

};

export default function( opts ) {
  return new QNStorage( opts );
};
