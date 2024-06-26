import {User,Review,Movie} from "../Models/models.js"
import { generateToken} from "../utils/token.js"

class UserController{

async getUsers(req,res){
    try {
        const usuarios = await User.findAll({
            attributes:["userId","name","email"]})
        res.status(200).send({success:true,message:usuarios})
    } catch (error) {
        res.status(400).send({success:false,message:error.message})
    }
} 

/**
 * @api{get}/users/:userId, se obtiene información del usuario por id
 * @returns en caso de encontrarlo, devolverá las reseñas a películas que ha visto.
 */
async getUserId(req,res){
    try {
        const {userId}= req.params;
        const usuario = await User.findOne({
            attributes:["userId","name","email"],
            where:{
                userId:userId
            },
            include:[
                {
                    model:Review,
                    attributes:["reviewId","rating","comment","movieId"],//Ver si me sirve el id tanto del Review como de Movie
                    include:[
                        {
                            model:Movie,
                            attributes:["titulo","descripcion","año_de_lanzamiento"],
                        }
                    ]
                }
            ]
        })
        if(!usuario){
            return res.status(404).send({ success: false, message: "Usuario no encontrado" });
        } 
        res.status(200).send({success:true,message:usuario})
    } catch (error) {
        res.status(400).send({success:false,message:error.message})
    }
}
/**
 * @api{post}/users/
 * válida que los campos que llegan por el body existan, caso contrario respondera con un error de tipo 400
 * @returns una vez válidado creara al usuario y lo agregara en la base de datos, retorna status 201(created) y 
 * el nombre y el mail del usuario.
 */
async createUser(req,res){
    try {
        const {name,email,password} = req.body;
        if(!name || !email || !password){
            return res.status(400).send({ success: false, message: "Todos los campos son obligatorios" });
        }
        const newUser = await User.create({name,email,password})
        res.status(201).send({success:true,message:"user created",user:[newUser.name,newUser.email]})  
    } catch (error) {
        res.status(400).send({success:false,message:error.message})
    }
}

async updateUser(req,res){
    try {
        const {userId} = req.params
        const {name,email,password} =req.body;
        const [update] = await User.update({name,email,password},{where:{userId}})
        if(update){
            res.status(200).send({ success: true, message: "Usuario modificado" });
        }else{
            res.status(404).send({ success: false, message: "Usuario no encontrado" });
        }
    } catch (error) {
        res.status(400).send({success:false,message:error.message})
    }
}

async deleteUser(req,res){
    try {
        const {userId} = req.params;
        const deleted = await User.destroy({
            where: {
                userId:userId,
            }
        })
        if (deleted){
            res.status(200).send({success:true,message:"Usuario borrado"})
        }else{
            res.status(404).send({ success: false, message: "Usuario no encontrado" });
        }
        
    } catch (error) {
        res.status(400).send({success:false,message:error})
    }
}

/**
 * @api{post}/users/login Inicia sesión
    en caso de esta mal el email o la contraseña lanzara una respuesta de tipo (404 No Content)
    @method{generateToken()}recibe un payload(objeto con datos del usuario). Retorna un token
 * @returns el token generado se guarda en una cookie.
 */
login =async (req,res) => {
    try {
        const {email,password} = req.body;
        const user = await User.findOne({
            where:{
                email,
            }
        })
        if(!user){
            return res.status(404).send({success:false,message:"Email inválido"});
        }

        const isPassword = await user.comparePassword(password)

        if(!isPassword){
            return res.status(401).send({success:false,message:"Contraseña incorrecta"});
        }

        const payload = {
            userId:user.userId,
            name:user.name,
        }

        const token = generateToken(payload)
        //console.log("token ---- : " + token)
        res.cookie("token", token)
        res.status(200).send({success:true,message:"usuario logueado con exito"})
    } catch (error) {
        res.status(400).send({success:false,message:error.message})
    }
}
/**
 * @api {get} /users/me Se obtiene información del usuario autenticado.
 * @return respuesta de tipo (200 OK), procede a mandar la información data del usuario
 */
me = async (req,res)=>{
    try {
        const {user} = req
        res.status(200).send({success:true,message:user})
    } catch (error) {
        res.status(400).send({success:false,message:error.message})
    }
}

}

export default UserController;