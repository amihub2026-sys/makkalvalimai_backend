const service=require('../services/ad.service');const {wrap}=require('../utils/common');exports.public=wrap(async(req,res)=>res.json(await service.public()));exports.adminList=wrap(async(req,res)=>res.json(await service.all()));exports.save=wrap(async(req,res)=>res.json(await service.save(req.params.id,req.body)));

exports.remove=wrap(async(req,res)=>res.json(await service.remove(req.params.id)));
