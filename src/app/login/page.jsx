"use client";

import SignupPage from "@/app/_components/Authentication/SignUp";
import LoginPage from "../_components/Authentication/Login";
import React from 'react'

export default function Login() {
    
    const [isSignUp, setIsSignUp] = React.useState(false)

    return (
        
        <div className="login_container">

            <section className='login_text'>

                <p className="login_header_app_name">Friend Bridge</p>
                <p className="login_header_app_explanation">A chance to meet people from around the world, share your thoughts, and connect with others who share your interests!</p>

            </section>

            {isSignUp ? (<SignupPage changePage={setIsSignUp}/>)
            :
            (<LoginPage changePage={setIsSignUp}/>)}
            
        </div>
            
    )

}