import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCLoudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // Upload an image
        const response = await cloudinary.uploader
            .upload(
                localFilePath, {
                resource_type: "auto"
            }
            )
            .catch((error) => {
                console.log(error);
            });
        console.log("File uploaded")
        console.log(uploadResult);

        // once file is uploaded delete form server
        fs.unlinkSync(localFilePath);
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null
    }
}

export { uploadOnCLoudinary }