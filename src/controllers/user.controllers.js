import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCLoudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    // Validation
    if ([fullName, username, email, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields (fullName, email, username, password) are required");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    });

    if (existedUser) {
        throw new ApiError(409, "Username or email already exists");
    }

    // --- File Handling ---
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverLocalPath = req.files?.coverImage?.[0]?.path; // Optional

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    let avatar = null;
    let coverImage = null;

    try {
        // Upload Avatar (Required)
        avatar = await uploadOnCLoudinary(avatarLocalPath);
        if (!avatar) {
            // uploadOnCloudinary handles cleanup of local file on failure
            throw new ApiError(500, "Failed to upload avatar, please try again.");
        }
        console.log("Uploaded avatar URL:", avatar.url);

        // Upload Cover Image (Optional)
        if (coverLocalPath) {
            coverImage = await uploadOnCLoudinary(coverLocalPath);
            // If cover image upload fails, we might proceed without it or throw error
            // Here, we'll proceed but log it. Could throw ApiError(500, "Failed to upload cover image")
            if (!coverImage) {
                console.error("Cover image was provided but failed to upload. Proceeding without cover image.");
            } else {
                 console.log("Uploaded coverImage URL:", coverImage?.url);
            }
        }

        // --- User Creation ---
        const user = await User.create({
            fullName,
            avatar: avatar.url, 
            coverImage: coverImage?.url || "", 
            email: email.toLowerCase(),
            password, // Hashing is handled by the pre-save hook in user.models.js
            username: username.toLowerCase(), 
        });

        // Retrieve the created user without sensitive fields
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken" 
        );

        if (!createdUser) {
            // This case is unlikely if create succeeded, but good to handle
            // Cleanup uploaded files if user retrieval fails somehow
            await deleteFromCloudinary(avatar.public_id, avatar.resource_type);
            if (coverImage) {
                 await deleteFromCloudinary(coverImage.public_id, coverImage.resource_type);
            }
            throw new ApiError(500, "Something went wrong while fetching created user details");
        }

        // Success Response
        return res
            .status(201)
            .json(new ApiResponse(201, createdUser, "User registered successfully"));

    } catch (error) {
         // --- Error Handling & Cleanup ---
         // If an error occurred *after* files were potentially uploaded, clean them up
        console.error("User registration failed:", error);

        // Use the public_id returned by Cloudinary for deletion
        if (avatar?.public_id) {
            console.log("Attempting to delete uploaded avatar due to error...");
            await deleteFromCloudinary(avatar.public_id, avatar.resource_type);
        }
        if (coverImage?.public_id) {
             console.log("Attempting to delete uploaded cover image due to error...");
            await deleteFromCloudinary(coverImage.public_id, coverImage.resource_type);
        }

        // Re-throw the original error or a generic one
        // If it's already an ApiError, it will be handled by the global error handler
        // Otherwise, wrap it
        if (error instanceof ApiError) {
            throw error;
        } else {
            throw new ApiError(500, error.message || "An error occurred during user registration", [], error.stack);
        }
    }
});

// Typo fix in export if needed (refresh vs referesh)
export { registerUser };