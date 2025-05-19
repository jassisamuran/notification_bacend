import express from 'express'
import dotenv from 'dotenv'
dotenv.config();
import cors from 'cors'
import routes from './routes'
import connectDb from './modules/database/mongoose'
import User from './models/User'

connectDb();
import notificationRoutes from './src/routes/notificationRoutes'
const app=express()
const PORT=process.env.PORT || 5000
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use('/api/notifications', notificationRoutes);

app.listen(PORT, () => {
    (async () => {
       
        console.log("User created:", await User.find());
        console.log(`Server is running on port ${PORT}`);
    })();
});