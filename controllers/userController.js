const multer = require("multer");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./../controllers/handlerFactory");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/users");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  }
});
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("not an image!!!", 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.uploadUserPhoto = upload.single("photo");
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "THIS ROUT IS NOT FOR UPDATE PASSWORDS. PLEASE USE /updatePassword",
        400
      )
    );
  }

  // 2) update user document
  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser
    }
  });
});

exports.creatUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "this rout is not yet defined. Please Use signup instead!"
  });
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = factory.getOne(User);
exports.modifyUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getAllUsers = factory.getAll(User);
