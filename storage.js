const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: "drcppgyu4",
  api_key: "523569439774969",
  api_secret: "2sAygpmjech03F8tTDtF1Xe1CzY",
});

// cloudinary.config({
//   cloud_name: "denydtgwd",
//   api_key: "655273999632212",
//   api_secret: "X2DIeCgbETuK6LFVFqLnBjBLT_w",
// });

exports.storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Cloudinary Demo",
    allowed_formats: ["jpeg", "png", "jpg"],
  },
});
