from fpdf import FPDF
def export_rc_beam_pdf(project: dict, inputs: dict, results: dict) -> bytes:
    pdf = FPDF(); pdf.add_page(); pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, f"RC Beam - {project['name']}", ln=1)
    pdf.set_font("Arial", "", 11)
    pdf.multi_cell(0, 6, f"Inputs:\n{inputs}\n\nResults:\n{results}")
    return pdf.output(dest="S").encode("latin1", "ignore")
