import express from "express"
import env from "dotenv"
import cors from "cors"
import z from 'zod'
import pg from "pg";
import axios from "axios";
import nodemailer from 'nodemailer'
import multer from 'multer'
import {v2 as cloudinary} from 'cloudinary'
import { Resend } from "resend";


env.config();

const port = process.env.PORT || 5000;
const ConString = process.env.NEONSTRING

const app = express();
app.use(cors());
app.use(express.json());

cloudinary.config({ 
    cloud_name: process.env.CLOUDINAME, 
    api_key: process.env.CLOUDIAPI, 
    api_secret: process.env.CLOUDISECRET 
  });

const userReqInfoSchema = z.object({
    name : z.string().trim(),
    username : z.string().trim(),
    password : z.string().min(6).trim(),
    email : z.string().email().trim()
})

const userFullInfoSchema = z.object({
    name : z.string().trim(),
    username : z.string().trim(),
    password : z.string().min(6).trim(),
    email : z.string().email().trim(),
    profileURL : z.string().optional(),
    location : z.string().optional(),
    reason1 : z.boolean(),
    reason2 : z.boolean(),
    reason3 : z.boolean(),
    verified : z.boolean()
})

const newEmailSchema = z.object({
    username : z.string(),
    newEmail : z.string().email(),
    verified : z.boolean()
})

const verifyReqInfo = (req, res, next) => {
    try{
        userReqInfoSchema.parse(req.body);
        next();
    } catch (error) {
        res.json({
            stat : false,
            msg : error.message
        })
    }
}

const verifyAllInfo = (req, res, next) => {
    try{
        userFullInfoSchema.parse(req.body);
        next();
    } catch (error) {
        res.json({
            stat : false,
            msg : error.message
        })
    }
}

const verifyNewEmail = (req, res, next) => {
    try{
        newEmailSchema.parse(req.body);
        next();
    } catch (error) {
        res.json({
            stat : false,
            msg : error.message
        })
    }
}

const storage = multer.diskStorage({
    destination : function(req, file, cb){
        return cb(null, "assets/images")
    },
    filename : function (req, file, cb){
        return cb(null, `${Date.now()}_${file.originalname}`)
    }
})

const upload = multer({storage})

// app.get(`/dump`, async (req, res) => {
    
//     const db = new pg.Client(ConString);
//     try {
//         await db.connect();
//         await db.query(`delete from userinfo`);
//         res.json({
//             stat: true,
//             msg: 'OK'
//         })
//     } catch (error) {
//         res.json({
//             stat:false,
//             msg: error.message
//         })
//     }
//     db.end()
// })

app.post(`/registeruser`, verifyReqInfo,  async (req, res) => {
    const db = new pg.Client(ConString)
    try {
        await db.connect();
        let response = await db.query("insert into userinfo(name, username, email, password) values ($1, $2, $3, $4)", [req.body.name, req.body.username, req.body.email, req.body.password]);
        res.json({
            stat : true,
            msg : `User Registered`
        })
    } catch (error) {
        res.json({
            stat : false,
            msg : error.message
        })
    }
    db.end()
})

app.post(`/sendverification`, verifyAllInfo, async (req, res) => {
    let allInfo = req.body;
    const db = new pg.Client(ConString);
    try {
        await db.connect();
        let response = await db.query(`update userinfo set profileURL=$1, location=$2, reason1=$3, reason2=$4, reason3=$5, verified=$6  where username=$7`, [allInfo.profileURL, allInfo.location, allInfo.reason1, allInfo.reason2, allInfo.reason3, allInfo.verified, allInfo.username]);
        console.log(allInfo.email);
        let htmlResponse = `<p><strong>${allInfo.username}</strong>Thank you for signing up on <strong>Dribbble</strong>!</p>`
        const resend = new Resend(process.env.RESENDAPI);
        try{
            const response2 = await resend.emails.send({
                from: 'Fake Dribbble Admin <noreply@uttkarshranjan.tech>',
                to: allInfo.email,
                subject: 'Dribbble Fake Verification Email',
                html: htmlResponse
            });
        }catch(error){
            console.log(error.message);
            throw new Error(error.message)
        }

        console.log(`XXXXX`)
        res.json({
            stat: true,
            msg: `OK`
        })
    } catch(error){
        res.json({
            stat: false,
            msg: error.message
        })
    }
    db.end();
})

app.post(`/emailchange`, verifyNewEmail, async (req, res) => {
    console.log(req.body)
    let info = req.body;
    const db = new pg.Client(ConString);
    
    const resend = new Resend(process.env.RESENDAPI);
    try {
        await db.connect();
        let response = await db.query(`update userinfo set email=$1, verified=$2 where username=$3`, [info.newEmail, info.verified, info.username]);
        
        let htmlResponse = `<p><strong>${info.username}</strong>Thank you for signing up on <strong>Dribbble</strong>!</p>`

        const response2 = await resend.emails.send({
            from: 'Fake Dribbble Admin <noreply@uttkarshranjan.tech>',
            to: info.newEmail,
            subject: 'Hello World',
            html: htmlResponse
        });
        
        res.json({
            stat: true,
            msg: `OK`
        })
    } catch (error) {
        res.json({
            stat : false,
            msg : error.message
        })
    }
    db.end();
})

app.post(`/uploadprofilepic`, upload.single('file'), async (req, res) => {
    try {
        console.log(req.file)
        console.log(`${req.file.path}`)
        let response = await cloudinary.uploader.upload(req.file.path)
        console.log(response)
        res.json({
            stat: true,
            msg: `${response.url}`
        })
    } catch (error) {
        res.json({
            stat: false,
            msg: `${error.message}`
        })
    }
})

app.listen(port, ()=>{
    console.log(`Server runnning on port : ${port}`);
})