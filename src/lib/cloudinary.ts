import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function uploadToCloudinary(file: File, folder = "webbheads_cms"): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`

  const result = await cloudinary.uploader.upload(base64, {
    folder,
    resource_type: "auto",
  })

  return result.secure_url
}

export { cloudinary }
