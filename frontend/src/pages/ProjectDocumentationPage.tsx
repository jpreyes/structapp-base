import {
  Alert,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import DomainIcon from "@mui/icons-material/Domain";
import LayersIcon from "@mui/icons-material/Layers";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import TerrainIcon from "@mui/icons-material/Terrain";
import WavesIcon from "@mui/icons-material/Waves";

const ProjectDocumentationPage = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5">Documentación del proyecto</Typography>
      <Alert severity="info">
        Centraliza en un solo lugar las memorias de cálculo, anexos y bases de diseño. Esta versión muestra la
        estructura propuesta y enlaces de ejemplo que se conectarán con archivos reales en iteraciones futuras.
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <DescriptionIcon color="primary" />
                <Box>
                  <Typography variant="h6">Reportes y memorias</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Descarga los documentos generados por los módulos de cálculo y las memorias finales aprobadas.
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={1}>
                <Button variant="outlined" startIcon={<PictureAsPdfIcon />} disabled>
                  Reporte RC Beam más reciente (próximamente)
                </Button>
                <Button variant="outlined" startIcon={<PictureAsPdfIcon />} disabled>
                  Memorándum de revisión sísmica (próximamente)
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <CloudDownloadIcon color="primary" />
                <Box>
                  <Typography variant="h6">Especificaciones y anexos</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gestiona especificaciones técnicas, memorias justificativas y anexos complementarios del proyecto.
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={1}>
                <Button variant="outlined" disabled>
                  Memoria de cálculo estructural (pendiente)
                </Button>
                <Button variant="outlined" disabled>
                  Especificaciones técnicas (pendiente)
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Bases de cálculo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Define los supuestos de diseño que aplican al proyecto para garantizar coherencia entre las distintas
            disciplinas.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ArchitectureIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Tipo de edificio"
                    secondary="Habitacional | Comercial | Industrial | Infraestructura"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <DomainIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Materialidad principal"
                    secondary="Hormigón armado, acero estructural, madera laminada, mixto"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LayersIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Normativa" secondary="NCh430, ACI 318, AISC 360, NCh432, ASCE 7, Eurocódigos" />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={4}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <TerrainIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Cargas muertas"
                    secondary="Peso propio estructural, tabiques, terminaciones, instalaciones permanentes"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ArchitectureIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Sobrecargas de uso"
                    secondary="De acuerdo al programa: oficinas, vivienda, estacionamientos, cubiertas transitables"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WavesIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Cargas de viento"
                    secondary="Presiones positivas/negativas según zona geográfica y categoría de exposición"
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={4}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ThunderstormIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Cargas sísmicas"
                    secondary="Espectro de diseño, aceleraciones zonales, factores de comportamiento y sobre-resistencia"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CloudDownloadIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Cargas de nieve"
                    secondary="Altura de acumulación, coeficientes térmicos y de exposición, según reglamentación local"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LayersIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Sobrecarga de cubierta"
                    secondary="Mantenimientos, equipos sobre techumbre, paneles solares, acumulación de agua"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Próximas integraciones
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            A futuro podrás adjuntar y versionar memorias de cálculo firmadas, fichas técnicas de materiales, resultados
            de softwares externos (ETABS, SAP2000, Tekla) y documentación complementaria como planos de detalle y
            ensayos de laboratorio. También se habilitará la subida de plantillas personalizadas de bases de cálculo por
            tipología de proyecto.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProjectDocumentationPage;
