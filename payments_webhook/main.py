from fastapi import FastAPI, Request
app = FastAPI(title="StructApp Payments Webhook")
@app.get("/healthz")
def healthz(): return {"ok": True}
@app.post("/webhook/mercadopago")
async def mp(req: Request):
    event = await req.json()
    # TODO: validar firma y actualizar billing_accounts en Supabase
    return {"ok": True, "received": True}
@app.post("/webhook/paypal")
async def pp(req: Request):
    event = await req.json()
    # TODO: validar con PAYPAL_WEBHOOK_ID y actualizar billing_accounts
    return {"ok": True, "received": True}
