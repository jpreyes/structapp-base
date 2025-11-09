from pathlib import Path
path = Path('services/design_bases_service.py')
data = path.read_bytes()
for old, new in [
    (b'direcci\xf3n', b'direcci\xc3\xb3n'),
    (b'Categor\xfa\x99a', b'Categor\xc3\xad\x61'),
]
:
    data = data.replace(old, new)
path.write_bytes(data)
