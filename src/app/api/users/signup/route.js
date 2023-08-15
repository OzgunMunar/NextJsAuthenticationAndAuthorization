import {ConnectToDB} from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { sendEmail } from "@/helpers/mailer";

ConnectToDB()

export async function POST(request){

    try {
        
        const reqBody = await request.json()
        const {username, email, password} = reqBody

        //check if user already exists
        const user = await User.findOne({email})

        console.log("sign up route side")
        
        if(user){
            return NextResponse.json({message: "User already exists"}, {status: 400})
        }

        //hash password
        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(password, salt)

        const newUser = new User({
            username,
            email,
            password: hashedPassword
        })

        const savedUser = await newUser.save()
        await sendEmail({email, emailType: "VERIFY", userId: savedUser._id})

        return NextResponse.json({
            message: "User created successfully",
            success: true,
            savedUser
        })
        
    } catch (error) {
        return NextResponse.json({error: error.message}, {status: 500})

    }
}