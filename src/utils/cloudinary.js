import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import dotenv from "dotenv"
import { publicDecrypt } from 'crypto';

dotenv.config({
    path: "./src/.env",
    credentials: true
});

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCLoudinary = async (localFilePath) => {
    try {
        if (!localFilePath){
            console.log("local file not found")
            return null
        }
        
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

const deleteFromCloudinary = async(publicId) => {
    try {
        const result = await  cloudinary.uploader.destroy(publicId);
        console.log("Deleted from the claudinary")
    } catch (error) {
        console.log("Error deleting from the cloudinary", error)
    }
}

export { uploadOnCLoudinary, deleteFromCloudinary }