import { Router } from "express";
import { sendMessage } from "../../kafka/producer";
import { timeStamp } from "console";
import notificationSchema from "../../models/notificationSchema";
const notificationRoutes: Router = Router();

notificationRoutes.post(
  "/",

  (req, res) => {
    try {
      const bo_dy = req.body;
      res.send({
        message: "Notification sent successfully",
        data: body,
      });
      sendMessage(body);
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).send({
        message: "Failed to send notification",
        error: (error as Error).message,
      });
    }
  },
);

notificationRoutes.post("/send", async (req, res) => {
  try {
    const notificationData = req.body
    const notification = new notificationSchema({
      type: notificationData.type,
      to: notificationData.type,
      from: notificationData.from,
      userId: notificationData.userId,
      priority: notificationData.priority || 10,
      message: notificationData.message,
      subject: notificationData.subject,
      metadata: notificationData.metadata,
      status: "queued",
    });

    await notification.save()
    await sendMessage(...notificationData,
      notificationId:notification._id.toString(),
      timeStamp:Date.now(),
    )

    res.status(201).json({
      success:true,
      notificationId:notification._id,
      status:'queue',
      message:'notification queued successfully'
    })
  } catch (error) {
    console.log("Error sending notification:",error)
    res.status(500).json({
      success:false,
      error:"Failed to queue notification"
    })
  }
});

notificationRoutes.get("/:id",async(req,res)=>{
  try{
    const notification=await notificationSchema.findById(req.params.id);

    if(!notification){
      res.status(404).json({
        success:false,
        error:"Notification not found"
      })
    }

    res.json({
      success:true,
      notification:{
        id:notification._id,
        type:notification.type,
        to:notification.to,
        status:notification.status,
        retries:notification.retries,
        createdAt:notification.createdAt,
        updatedAt:notification.updatedAt,
        deliveryResult:notification.deliveryResult,
      }
    })
  }catch(error){
    console.error("Error fetching notification",error);
    res.status(500).json({
      success:false,
      error:"Failed to fetch notification"
    })
  }
})

notificationRoutes.get("/user/:userId",async(req,res)=>{
  try{
    const {userId}=req.params;
    const {page=1,limit=20,status,type}=req.body;
    
    const query:any=  {userId}
    if(status)query.status=status;
    if(type)query.type=type;

    const notifications=await notificationSchema.find(query)
    .sort({createdAt:-1})
    .limit(Number(limit))
    .skip((Number(page)-1)*Number(limit))
    
    const total=await=notificationSchema.countDocuments(query)
    res.json({
      success:true,
      notifications,
      pagination:{
        page:Number(page),
        limit:Number(limit),
        total,
        page:Math.ceil(total/Number(limit))
      }
    })

  }catch(error){
    res.status(500).json({
      success:false,
      error:"Failed to fetch notifications"
    })
  }
})

notificationRoutes.post("/:id/retry",async(req,res)=>{
  try{
    const notification =await notificationSchema.findById(req.params.id);

    if(!notification){
      res.status(404).json({
        success:false,
        error:"Notification not found"
      })
    }

    if(notification.status!='failed'){
      return res.status(400).json({
        success:false,
        error:"Only failed notificatios can be retried"
      })
    }
    
    notification.status='queued';
    notification.retries=0;
    await  notification.save();

    await sendMessage({
      type: notification.type,
      to: notification.to,
      from: notification.from,
      message: notification.message,
      userId: notification.userId.toString(),
      priority: notification.priority,
      notificationId: notification._id.toString(),
      timestamp: Date.now(),
    });

    res.json({success:true,
    success:true,
      message:"Notification requested for retry",
      notificationId:notification._id    
    })
    
  }catch(error){
    console.log("Error retrying notification",error)
    res.status(500).json({
      success:false,
      error:"Failed to retry notification"
    })
  }
})

notificationRoutes.get("/status/summary",async(req,res)=>{
  const {startDate,endDate}=req.query;

  const dataFilter:any={};
  if(startDate)dataFilter.%gte=new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);


})

export default notificationRoutes;
