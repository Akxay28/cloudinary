const Profile = require("./schema");
const cloudinary = require("cloudinary").v2;

// Image upload
exports.imageUpload = async (req, res) => {
  try {
    const { name, contact } = req.body;

    console.log(req.body, "this is req.body in controller");
    console.log(req.file, "this is req.file in controller");

    const profile = await Profile.create({
      name,
      contact,
      image: req.file?.path, // ✅ store Cloudinary URL instead of filename
    });

    if (profile) {
      res.json({
        success: true,
        message: "Record has been inserted",
        data: profile,
      });
    } else {
      res.json({
        success: false,
        message: "Something went wrong",
      });
    }
  } catch (error) {
    console.log(error, "error in controller");
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all profiles
exports.getProfile = async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.json({ success: true, data: profiles });
  } catch (error) {
    console.log("Error in getProfile:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get profile by ID
exports.getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    console.log("Error in getProfileById:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update profile by chat gpt

// exports.updateProfile = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, contact } = req.body;

//     console.log(req.body, "req.body for update");
//     console.log(req.file, "req.file for update");

//     const profile = await Profile.findById(id);
//     if (!profile) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Profile not found" });
//     }

//     // Delete previous image from Cloudinary if new image uploaded
//     if (req.file) {
//       const publicId = profile.image.split("/").pop().split(".")[0]; // extract Cloudinary public_id
//       await cloudinary.uploader.destroy(publicId);
//     }

//     // Update profile fields
//     profile.name = name || profile.name;
//     profile.contact = contact || profile.contact;
//     if (req.file) {
//       profile.image = req.file.path; // new Cloudinary image path
//     }

//     await profile.save();

//     res.json({
//       success: true,
//       message: "Profile updated successfully",
//       data: profile,
//     });
//   } catch (error) {
//     console.log("Error in updateProfile:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// Update profile by claude ai
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact } = req.body;

    // console.log(req.body, "req.body for update");
    // console.log(req.file, "req.file for update");

    const profile = await Profile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    // Delete previous image from Cloudinary if new image uploaded
    if (req.file && profile.image) {
      try {
        console.log("Previous image URL:", profile.image);

        // Method 1: Using URL parsing with proper URL decoding
        const getPublicIdFromUrl = (url) => {
          // Example URL: https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/folder/filename.jpg
          // or: https://res.cloudinary.com/your-cloud-name/image/upload/filename.jpg

          const parts = url.split("/");
          const uploadIndex = parts.indexOf("upload");

          if (uploadIndex === -1) {
            throw new Error("Invalid Cloudinary URL");
          }

          // Get everything after 'upload/'
          const pathAfterUpload = parts.slice(uploadIndex + 1);

          // Join the path and remove file extension
          let publicId = pathAfterUpload.join("/");

          // Remove version if present (v1234567890/)
          publicId = publicId.replace(/^v\d+\//, "");

          // Remove file extension
          publicId = publicId.replace(/\.[^/.]+$/, "");

          // IMPORTANT: Decode URL encoding (e.g., %20 back to spaces)
          publicId = decodeURIComponent(publicId);

          return publicId;
        };

        const publicId = getPublicIdFromUrl(profile.image);
        console.log("Extracted public_id:", publicId);

        // Attempt to delete from Cloudinary
        const deletionResult = await cloudinary.uploader.destroy(publicId);
        console.log("Cloudinary deletion result:", deletionResult);

        // Check deletion result
        if (deletionResult.result === "ok") {
          console.log("✅ Previous image deleted successfully");
        } else if (deletionResult.result === "not found") {
          console.log(
            "⚠️ Previous image not found in Cloudinary (already deleted?)"
          );
        } else {
          console.log("❌ Failed to delete previous image:", deletionResult);
        }
      } catch (deleteError) {
        console.error("Error deleting previous image:", deleteError);
        // Continue with update even if deletion fails
      }
    }

    // Update profile fields
    profile.name = name || profile.name;
    profile.contact = contact || profile.contact;
    if (req.file) {
      profile.image = req.file.path; // new Cloudinary image path
      console.log("New image URL:", req.file.path);
    }

    await profile.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
    console.log("Error in updateProfile:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// BETTER APPROACH: Store public_id in database
// ============================================

/*
// 1. First, update your Profile schema to include publicId:
const profileSchema = new mongoose.Schema({
  name: String,
  contact: String,
  image: String,        // Cloudinary URL
  imagePublicId: String // Cloudinary public_id
});

// 2. When creating profile initially:
exports.createProfile = async (req, res) => {
  try {
    const { name, contact } = req.body;
    
    const profileData = {
      name,
      contact,
    };
    
    if (req.file) {
      profileData.image = req.file.path;
      profileData.imagePublicId = req.file.filename; // This is the public_id
    }
    
    const profile = new Profile(profileData);
    await profile.save();
    
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Updated updateProfile with stored public_id:
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact } = req.body;

    const profile = await Profile.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Delete previous image using stored public_id
    if (req.file && profile.imagePublicId) {
      try {
        const deletionResult = await cloudinary.uploader.destroy(profile.imagePublicId);
        console.log("Deletion result:", deletionResult);
      } catch (deleteError) {
        console.error("Error deleting image:", deleteError);
      }
    }

    // Update profile
    profile.name = name || profile.name;
    profile.contact = contact || profile.contact;
    
    if (req.file) {
      profile.image = req.file.path;
      profile.imagePublicId = req.file.filename; // Store new public_id
    }

    await profile.save();
    res.json({ success: true, message: "Profile updated successfully", data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
*/

// Delete profile
exports.deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await Profile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    // Delete image from Cloudinary
    if (profile.image) {
      // Method 1: Extract public_id from Cloudinary URL (recommended)
      const urlParts = profile.image.split("/");
      const fileWithExt = urlParts[urlParts.length - 1];
      const publicId = fileWithExt.split(".")[0];
      const fullPublicId = `Cloudinary Demo/${publicId}`; // Include folder name

      // Alternative Method 2: Using regex (more robust)
      // const regex = /\/v\d+\/(.+)\./;
      // const match = profile.image.match(regex);
      // const fullPublicId = match ? match[1] : null;

      console.log("Attempting to delete image with publicId:", fullPublicId);

      const result = await cloudinary.uploader.destroy(fullPublicId);
      console.log("Cloudinary deletion result:", result);

      // Check if deletion was successful
      if (result.result !== "ok") {
        console.warn("Image deletion from Cloudinary failed:", result);
      }
    }

    // Delete profile from DB
    await Profile.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.log("Error in deleteProfile:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Alternative approach: Store public_id when uploading
// When uploading, you could store the public_id separately:
/*
exports.uploadProfile = async (req, res) => {
  try {
    // After successful upload to Cloudinary
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "Cloudinary Demo"
    });
    
    // Store both URL and public_id in your database
    const profile = new Profile({
      image: result.secure_url,
      imagePublicId: result.public_id, // Store this for easy deletion
      // ... other fields
    });
    
    await profile.save();
  } catch (error) {
    // handle error
  }
};

// Then in deleteProfile, you can simply use:
// await cloudinary.uploader.destroy(profile.imagePublicId);
*/
