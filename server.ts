import express from 'express'
import dotenv from 'dotenv'
dotenv.config();
import cors from 'cors'
import routes from './routes'
import connectDb from './modules/database/mongoose'
connectDb();

const app=express()
const PORT=process.env.PORT || 5000
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use('api',routes)
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
}
);