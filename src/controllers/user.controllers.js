import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js"
import { uploadOnCLoudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    // validation
    if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required",)
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "Username or email already exist",)
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar not found")
    }

    // const avatar = await uploadOnCLoudinary(avatarLocalPath)

    // let coverImage;
    // if (coverImage) {
    //     coverImage = await uploadOnCLoudinary(coverLocalPath)
    // }

    let avatar;

    try {
        avatar = await uploadOnCLoudinary(avatarLocalPath)
        console.log("Uploaded avatar", avatar)
    } catch (error) {
        console.log("Error uploading avatar: ", error)
        throw new ApiError(500, "Failed to upload avatar")
    }

    let coverImage;

    try {
        coverImage = await uploadOnCLoudinary(coverLocalPath)
        console.log("Uploaded coverImage", coverImage)
    } catch (error) {
        console.log("Error uploading coverImage: ", error)
        throw new ApiError(500, "Failed to upload coverImage")
    }

    try {
        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url,
            email,
            password,
            username: username.tolowercase()
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refereshToken"
        );

        if (!createdUser) {
            throw new Error(500, "Someting went wrong")
        }

        return res.status(201).json(new ApiResponse(201, createdUser, "User created successfully"))
    } catch (error) {
        console.log("user creation failed", error)
        if (avatar){
            await deleteFromCloudinary(avatar.public_id)
        }

        if (coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }
    }
})

export {
    registerUser
}