import Settings from "@/helpers/api/classes/Settings"
import { User } from "@/helpers/api/classes/User"
import { middleWareForAuthorisation } from "@/helpers/api/user"
import { varNotEmpty } from "@/helpers/general"
import moment from "moment"

export default async function handler(req, res) {
    if (req.method === 'GET') {
        if(req.headers.authorization!=null && await middleWareForAuthorisation(req.headers.authorization))
        {
            
                var userid=await User.idFromAuthorisation(req.headers.authorization)
                var userObj = new User(userid)
                var isAdmin= await userObj.isAdmin()
                var settingKeys = await Settings.getAllforUserid(userid)
                var output = {user:settingKeys}
                
                if(isAdmin==true)
                {
                    output["admin"]=await Settings.getAllGlobal()
                }
                res.status(200).json( {success: true, data: {message: output}})


           
    
           

        }
        else
        {
            res.status(401).json({ success: false, data: { message: 'PLEASE_LOGIN'} })

        }
    }
    else
    {
        res.status(422).json({ success: false ,data: {message: "INVALID_METHOD"}})

    }
}