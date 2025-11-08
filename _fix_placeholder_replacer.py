from pathlib import Path
p = Path('services/design_bases_docx_service.py')
text = p.read_text(encoding='utf-8')
old1 = 'value = context.get(placeholder, f"{{{{placeholder}}}}")  # Mantiene el placeholder si no existe\r\n        return str(value) if value else ""'
new1 = 'if placeholder in context:\r\n            value = context[placeholder]\r\n            return "" if value is None else str(value)\r\n        return match.group(0)'
text = text.replace(old1, new1)
old2 = '        value = context.get(placeholder, "")\r\n\r\n        # Si no se encuentra el valor, mantener el placeholder para debug\r\n        if not value and placeholder not in context:\r\n            value = f"{{{{placeholder}}}}"\r\n\r\n        # Reemplazar el placeholder con su valor\r\n        new_text = new_text[:match.start()] + str(value) + new_text[match.end():]'
new2 = '        if placeholder in context:\r\n            value = context[placeholder]\r\n            value_str = "" if value is None else str(value)\r\n        else:\r\n            value_str = match.group(0)\r\n\r\n        # Reemplazar el placeholder con su valor\r\n        new_text = new_text[:match.start()] + value_str + new_text[match.end():]'
text = text.replace(old2, new2)
p.write_text(text, encoding='utf-8')
print('ok')
