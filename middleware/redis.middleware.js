
import { redis } from "@/lib/redis"


export const rateLimiter = async (req, res, next) => {
    try {
        const ip = req.ip
        const key = `rate_limit:${ip}`
        const requests = await redis.incr(key)

        if (requests == 1) {
            await redis.expire(key, 60)
        }

        if (requests > 5) {
            return res(429).json({ "message": "Too many requests, try after 1 minute" })
        }
    } catch (error) {
        return res(400).json(error.message)
    }

    next()
}

export const otpGenerator = async (req, res) => {
    try {
        const { email } = req.body
        const otp = Math.floor(10000 + Math.random() * 90000).toString()
        const key = `otp:${email}`

        await redis.set(key, 60, otp)

        return res.status(200).json({ "message": "OTP sent successfully", key })
    } catch (error) {
        return res.status(400).json(error.message)
    }
}