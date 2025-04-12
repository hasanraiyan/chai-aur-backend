import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";


dotenv.config({
    path: "./src/.env",
    credentials: true 
});

// Configuration - Ensure these ENV vars are loaded correctly
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


// At the top of src/utils/cloudinary.js, after dotenv.config()
console.log("Cloudinary Config Check:");
console.log("CLOUD_NAME:", process.env.CLOUD_NAME ? "Loaded" : "MISSING!");
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "Loaded" : "MISSING!");
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "Loaded (masked)" : "MISSING!");

const uploadOnCLoudinary = async (localFilePath) => {
    if (!localFilePath) {
        console.log("Local file path not provided.");
        return null;
    }

    let response = null;
    try {
        // Upload the file
        response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // Automatically detect resource type (image, video, raw)
        });

        // Log the response (not uploadResult)
        console.log("File uploaded successfully to Cloudinary:", response.url);

        // File uploaded successfully, now delete the local copy
        try {
            fs.unlinkSync(localFilePath);
            console.log("Local file deleted:", localFilePath);
        } catch (unlinkError) {
            // Log error if deletion fails, but proceed since upload was successful
            console.error("Error deleting local file:", localFilePath, unlinkError);
        }

        return response; // Return the full response object

    } catch (error) {
        console.error("Cloudinary upload failed:", error);

        // Attempt to delete the local file even if upload failed
        try {
            if (fs.existsSync(localFilePath)) { // Check if file exists before deleting
                 fs.unlinkSync(localFilePath);
                 console.log("Local file deleted after failed upload attempt:", localFilePath);
            }
        } catch (unlinkError) {
             console.error("Error deleting local file after failed upload:", localFilePath, unlinkError);
        }

        return null; // Return null to indicate failure
    }
};

const deleteFromCloudinary = async (publicId, resource_type = "image") => {
     if (!publicId) return null;
    try {
         // Need to specify resource_type for deletion, especially for non-image files (like video)
        const result = await cloudinary.uploader.destroy(publicId, { resource_type });
        console.log("Deleted from Cloudinary:", publicId, "Result:", result);
         return result;
    } catch (error) {
        console.error("Error deleting from Cloudinary:", publicId, error);
        return null;
    }
};

export { uploadOnCLoudinary, deleteFromCloudinary };