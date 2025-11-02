def run(inputs: dict) -> dict:
    b = float(inputs["b_mm"])/1000.0
    h = float(inputs["h_mm"])/1000.0
    L = float(inputs["L_m"])
    w = float(inputs["wl_kN_m"])
    Mu = w * L**2 / 8.0
    As_req = max(0.0015 * b * h * 1e6, 200)
    return {"Mu_kNm": round(Mu, 2), "As_req_mm2": round(As_req, 1), "ok": True}
