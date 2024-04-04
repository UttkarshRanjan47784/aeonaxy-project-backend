import express from "express"
import env from "dotenv"
import cors from "cors"

env.config();

const port = process.env.PORT;

const app = express();

app.use(cors());
app.use(express.json());

app.post(`/registeruser`, (req, res) => {
    if(Math.random()*10 < 5)
        res.json({
            stat : false,
            msg : `retry pookie`
        });
    else
        res.json({
            stat : true,
            msg : `Ok`
        });
})

app.post(`/reason`, (req, res) => {
    console.log(req.body)
    res.json({
        stat: true,
        msg: `OK`
    })
})

app.get(`/resendVerification`, (req, res) => {
    res.json(`OK`)
})

app.listen(port, ()=>{
    console.log(`Server runnning on port : ${port}`);
})