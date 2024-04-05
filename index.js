import express from "express"
import env from "dotenv"
import cors from "cors"
import z from 'zod'
import pg from "pg";
import axios from "axios";
import nodemailer from 'nodemailer'


env.config();

const port = process.env.PORT;
const ConString = process.env.NEONSTRING

const app = express();
app.use(cors());
app.use(express.json());

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


function sendVerEmail () {
    
}

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

app.get(`/dump`, async (req, res) => {
    
    const db = new pg.Client(ConString);
    try {
        await db.connect();
        await db.query(`delete from userinfo`);
        res.json({
            stat: true,
            msg: 'OK'
        })
    } catch (error) {
        res.json({
            stat:false,
            msg: error.message
        })
    }
    db.end()
})

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
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.GADDR,
                pass: process.env.GSTRING,
            }
        });
    
        const mailOptions = {
            from: {
                name : `Fake Dribbble Admin`,
                address : process.env.GADDR
            }, // sender address
            to: allInfo.email, // list of receivers
            subject: "Fake Dribbble account verification mail", // Subject line
            text: "Hello world?", // plain text body
            html: "<b>Hello world ?< /b>", // html body
        }
        await transporter.sendMail(mailOptions);
        
        res.json({
            stat: true,
            msg: `OK`
        })
    
    //     const sendMail = async (transporter, mailOptions) => {
    //         try {
    //         await transporter.sendMail(mailOptions); I
    //         console.log('Email has been sent!')
    //         } catch (error) {
    //             console.error(error);
    //         }
    //     }
    //     sendMail(transporter,mailOptions);
    // } catch (error) {
        // res.json({
        //     stat : false,
        //     msg : error.message
        // })
    } catch(error){
        res.json({
            stat: false,
            msg: error.message
        })
    }
    db.end()
})

app.post(`/emailchange`, verifyNewEmail, async (req, res) => {
    console.log(req.body)
    let info = req.body;
    const db = new pg.Client(ConString);
    try {
        await db.connect();
        let response = await db.query(`update userinfo set email=$1, verified=$2 where username=$3`, [info.newEmail, info.verified, info.username]);
        res.json({
            stat : true,
            msg : `OK`
        });
    } catch (error) {
        res.json({
            stat : false,
            msg : error.message
        })
    }
    db.end()
})

app.listen(port, ()=>{
    console.log(`Server runnning on port : ${port}`);
})