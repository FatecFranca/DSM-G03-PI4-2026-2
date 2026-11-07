export function adminMiddleware(req,res,next) {
  if (!req.usuario?.admin) {
    return res.status(403).json({
      error:
        "Acesso negado"
    })
  }
  next()
}