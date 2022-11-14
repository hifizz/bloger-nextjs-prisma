import fs from "fs";
import { join, extname } from "path";
import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import multer from "multer";
import sizeOf from "image-size";
// import multerQiniu from 'multer-storage-qiniu'
import multerQiniu from './_MulterStorageQiniu';
import imageService from "../../../modules/image/Image.service";

const filesDest = "public/uploads";
const filesDirectory = join(process.cwd(), filesDest);

function getStorage () {
  const canUseQiniuStorage =
    process.env.QINIU_ACCESS_KEY &&
    process.env.QINIU_SECRET_KEY &&
    process.env.QINIU_BUCKET;

  if (canUseQiniuStorage) {
    const qiniuStorage = multerQiniu({
      destination: function (req, file, cb) {
        cb(null, "");
      },
      filename: function (req, file, cb) {
        cb(null, file.originalname)
      },
      config: {
        ACCESS_KEY: process.env.QINIU_ACCESS_KEY,
        SECRET_KEY: process.env.QINIU_SECRET_KEY,
        bucket: process.env.QINIU_BUCKET,
      },
    });
    return qiniuStorage;
  }

  const diskStorage = multer.diskStorage({
    destination: filesDest,
    filename: (req, file, cb) => cb(null, file.originalname),
  });
  return diskStorage;
}

const imageFilter = function(req, file, cb) {
  // Accept images only
  // TODO: 这里限制只能传入web支持的图片格式
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
      req.fileValidationError = 'Only image files are allowed!';
      return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: getStorage(),
  fileFilter: imageFilter
}).array("theFiles");

interface QiniuUploadPayload {
  bucket: string;
  fsize: number; // byte
  hash: string; 
  key: string;
  name: string; // default value: "null"
}
interface NextApiRequestWithQiniu extends NextApiRequest {
  qiniuUploadPayload?: QiniuUploadPayload;
}
interface NextApiResponseWithQiniu extends NextApiResponse {}

const apiRoute = nextConnect<NextApiRequestWithQiniu, NextApiResponseWithQiniu>({
  onError(error, req, res) {
    res
      .status(501)
      .json({ error: `Sorry something Happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
}).use(upload);

apiRoute.use(async (req, res, next) => {
  if(req.qiniuUploadPayload) {
    const url = new URL(req.qiniuUploadPayload.key ,process.env.QINIU_CDN_DOMAIN).toString();
    const image = await imageService.create({
      key: req.qiniuUploadPayload.key,
      url
    });
    res.status(200).json({ ...image }); 
  }
  else {
    await next();
  }
})

// 检验库里是否有文件
// apiRoute.use((req, res, ) => {})

// 文件上传到cdn后落到数据库里

apiRoute.post((req, res) => {  
  if(req.qiniuUploadPayload) {
    res
      .status(200)
      .json({ data: "success", imageInfo: req.qiniuUploadPayload });
  } else {
    res.status(200).json({ data: "success" });
  }
});

apiRoute.delete((req, res) => {
  res.status(200).json({ data: "success" });
});

export async function getAllImages() {
  try {
    const targetExt = [".png", ".jpg", ".jpeg", ".gif"];
    const fetchFiles = () => {
      return new Promise((resolve, reject) => {
        fs.readdir(filesDirectory, (error, files) => {
          if (error) {
            reject(error);
          } else {
            const result = files
              .filter((file) => {
                return targetExt.includes(extname(file));
              })
              .sort();
            return resolve(result);
          }
        });
      });
    };
    return await fetchFiles();
  } catch (e) {
    console.log(e);
    return [];
  }
}

apiRoute.get(async (req, res) => {
  const allImages = await getAllImages();
  const result = [];
  for await (const image of allImages) {
    const dimensions = await sizeOf(join(filesDest, image));
    result.push({ src: join("/uploads", image), ...dimensions });
  }

  res.status(200).json({ data: result });
});

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};

export default apiRoute;
