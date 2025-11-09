Imports System.Data.SQLite
Public Class Form1
    Dim kll As Single
    Dim area As Single
    Dim l As Single
    Dim l0 As Single
    Dim q As Single
    Dim qtech As Single
    Dim pf, ce, ct, I, cs, pg As Single
    Dim incx, incx1, incx2, incy1 As Single
    Dim I_S, A_0, S_S, T0_S, TP_S, n_S, p_S, C_max, Txx, Tyy, RSs, PSs, Co_Sy, Co_Sx, C_min, Q0x As Single
    Dim Q0y, Q0_min, Q0_max, Rastx, Rasty, alfa_S, Sax, SAy, Qbasx, Qbasy As Single

    Private Sub TabPage7_Click(sender As Object, e As EventArgs) Handles TabPage7.Click

    End Sub

    Private Sub Label64_Click(sender As Object, e As EventArgs)


    End Sub

    Private Sub Label67_Click(sender As Object, e As EventArgs) Handles Label67.Click

    End Sub

    Private Sub Button8_Click_1(sender As Object, e As EventArgs) Handles Button8.Click
        Dim myconnection As New SQLiteConnection("Data source=d:\data.db;version=3")
        myconnection.Open()
        Dim cmd As New SQLiteCommand
        'Dim result As New DataSet
        cmd.Connection = myconnection
        cmd.CommandText = "Select * from proyectos"
        Dim rdr As SQLite.SQLiteDataReader = cmd.ExecuteReader
        Dim dt As New DataTable
        dt.Load(rdr)
        rdr.Close()
        myconnection.Close()
        For I As Integer = 0 To dt.Rows.Count - 1
            DataGridView5.Rows.Add(dt.Rows(I)("ID"), dt.Rows(I)("Proyecto"), dt.Rows(I)("Fecha"))
        Next

    End Sub

    Private Sub Label68_Click(sender As Object, e As EventArgs) Handles Label68.Click

    End Sub

    Private Sub DataGridView5_CellContentClick_1(sender As Object, e As DataGridViewCellEventArgs) Handles DataGridView5.CellContentClick

    End Sub

    Private Sub Ccs_SelectedIndexChanged(sender As Object, e As EventArgs) Handles Ccs.SelectedIndexChanged

    End Sub

    Private Sub Button7_Click(sender As Object, e As EventArgs) Handles Button7.Click

    End Sub

    Dim Htotal, Ak, Zkk, zkk1, Akpks, Fkx, Fky As Single
    Dim Zk(5) As Single
    Dim Pks(4) As Single


    Private Sub Label59_Click(sender As Object, e As EventArgs) Handles Label59.Click

    End Sub



    Private Sub Label53_Click(sender As Object, e As EventArgs) Handles Label53.Click

    End Sub

    Private Sub NPs_TextChanged(sender As Object, e As EventArgs) Handles NPs.TextChanged
        If Convert.ToSingle(NPs.Text) = 5 Then
            TH1.Enabled = True
            TH4.Enabled = True
            TH5.Enabled = True
            TH2.Enabled = True
            TH3.Enabled = True
            PS1.Enabled = True
            PS4.Enabled = True
            PS5.Enabled = True
            PS2.Enabled = True
            PS3.Enabled = True
        ElseIf Convert.ToSingle(NPs.Text) = 4 Then
            TH1.Enabled = True
            TH4.Enabled = True
            TH5.Enabled = False
            TH2.Enabled = True
            TH3.Enabled = True
            PS1.Enabled = True
            PS4.Enabled = True
            PS5.Enabled = False
            PS2.Enabled = True
            PS3.Enabled = True
        ElseIf Convert.ToSingle(NPs.Text) = 3 Then
            TH1.Enabled = True
            TH4.Enabled = False
            TH5.Enabled = False
            TH2.Enabled = True
            TH3.Enabled = True
            PS1.Enabled = True
            PS4.Enabled = False
            PS5.Enabled = False
            PS2.Enabled = True
            PS3.Enabled = True
        ElseIf Convert.ToSingle(NPs.Text) = 2 Then
            TH1.Enabled = True
            TH4.Enabled = False
            TH5.Enabled = False
            TH2.Enabled = True
            TH3.Enabled = False
            PS1.Enabled = True
            PS4.Enabled = False
            PS5.Enabled = False
            PS2.Enabled = True
            PS3.Enabled = False
        ElseIf Convert.ToSingle(NPs.Text) = 1 Then
            TH1.Enabled = True
            TH4.Enabled = False
            TH5.Enabled = False
            TH2.Enabled = False
            TH3.Enabled = False
            PS1.Enabled = True
            PS4.Enabled = False
            PS5.Enabled = False
            PS2.Enabled = False
            PS3.Enabled = False
        Else
            TH1.Enabled = False
            TH4.Enabled = False
            TH5.Enabled = False
            TH2.Enabled = False
            TH3.Enabled = False
            PS1.Enabled = False
            PS4.Enabled = False
            PS5.Enabled = False
            PS2.Enabled = False
            PS3.Enabled = False
        End If
    End Sub

    Private Sub DataGridView5_CellContentClick(sender As Object, e As DataGridViewCellEventArgs)

    End Sub

    Private Sub TabPage1_Click(sender As Object, e As EventArgs) Handles TabPage1.Click

    End Sub

    Private Sub Button2_Click(sender As Object, e As EventArgs)

    End Sub

    Private Sub MyApplicationBindingSource_CurrentChanged(sender As Object, e As EventArgs) Handles MyApplicationBindingSource.CurrentChanged

    End Sub

    Private Sub cbdesc_SelectedIndexChanged(sender As Object, e As EventArgs) Handles cbdesc.SelectedIndexChanged

    End Sub

    Private Sub cbedi_SelectedIndexChanged(sender As Object, e As EventArgs) Handles cbedi.SelectedIndexChanged
        If cbedi.Text = "Biblioteca" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Área de Lectura")
            cbdesc.Items.Add("Apilamiento de archivos <1,8m")
            cbdesc.Items.Add("Apilamiento extra por cada 0,3m adicionales")
            cbdesc.Items.Add("Pasillos")
        ElseIf cbedi.Text = "Bodegas" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Áreas de mercadería liviana")
            cbdesc.Items.Add("Áreas de mercadería pesada")
        ElseIf cbedi.Text = "Cárceles" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Áreas de celda")
            cbdesc.Items.Add("Pasillos")
        ElseIf cbedi.Text = "Escuelas" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Salas de Clases")
            cbdesc.Items.Add("Pasillos")
        ElseIf cbedi.Text = "Estacionamientos" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Vehículos livianos")
            cbdesc.Items.Add("Buses, camiones y otros vehículos pesados")
        ElseIf cbedi.Text = "Fábricas" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Industria liviana")
            cbdesc.Items.Add("Industria pesada")
        ElseIf cbedi.Text = "Hospitales" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Áreas de hospitalización")
            cbdesc.Items.Add("Laboratorios/quirófanos")
            cbdesc.Items.Add("Pasillos y salas de espera")
        ElseIf cbedi.Text = "Hoteles" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Habitaciones")
            cbdesc.Items.Add("Áreas públicas y sus pasillos")
        ElseIf cbedi.Text = "Iglesias" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Con asientos fijos")
            cbdesc.Items.Add("Con asientos móviles")
        ElseIf cbedi.Text = "Oficinas" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Privadas sin equipos")
            cbdesc.Items.Add("Públicas o privadas con equipos")
            cbdesc.Items.Add("Corredores")
        ElseIf cbedi.Text = "Teatros/estadios" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Áreas con asientos fijos")
            cbdesc.Items.Add("Áreas con asientos móviles o sin asientos")
            cbdesc.Items.Add("Áreas para escenarios")
            cbdesc.Items.Add("Áreas de general, lobbies, plataformas, boleterias, galerías y gradas")
        ElseIf cbedi.Text = "Gimnasios" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Pisos principales y balcones")
            cbdesc.Items.Add("Gradas/terrazas/accesos")
        ElseIf cbedi.Text = "Tiendas" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Áreas para ventas al por menor")

            cbdesc.Items.Add("Áreas para ventas al por mayor")
            cbdesc.Items.Add("Bodegas de elementos livianos")
            cbdesc.Items.Add("Bodegas de elementos pesados")
        ElseIf cbedi.Text = "Viviendas" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Áreas de uso general")
            cbdesc.Items.Add("Dormitorios y buhardillas habitables")
            cbdesc.Items.Add("Balcones que no excedan los 10 m2")
            cbdesc.Items.Add("Entretecho con almacenaje")
        ElseIf cbedi.Text = "Lugares especiales de uso público" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Corredores/lugares de uso público")
            cbdesc.Items.Add("Balcones exteriores")
            cbdesc.Items.Add("Aceras, accesos vehículares y patios sujetos a maniobras de camiones")
            cbdesc.Items.Add("Calzadas vehicular")
            cbdesc.Items.Add("Sala de juegos, incluyendo bolos y billares o similares")
            cbdesc.Items.Add("Pasarelas de mantenimiento")
            cbdesc.Items.Add("Pasarelas y plataformas elevadas de uso público")
            cbdesc.Items.Add("Escape de incendios")
            cbdesc.Items.Add("Escaleras y vías de evacuación")
            cbdesc.Items.Add("Parque de diversiones")
            cbdesc.Items.Add("Salas para equipos computacionales")
            cbdesc.Items.Add("Tribunales de justicia")
            cbdesc.Items.Add("Parrilla de piso en sala de máquina ascensores (en área 2,6 m2)")
            cbdesc.Items.Add("Museos")
            cbdesc.Items.Add("Áreas para fiestas y bailes")
            cbdesc.Items.Add("Comedores y restaurantes")
            cbdesc.Items.Add("Escaleras de gato para acceso de mantención")
            cbdesc.Items.Add("Cocina y lavandería")
            cbdesc.Items.Add("Estacionamiento de tren o metro")
        Else
            'ElseIf cbedi.Text = "Techos" Then
            cbdesc.Items.Clear()
            cbdesc.Items.Add("Con acceso peatonal (uso privado)")
            cbdesc.Items.Add("Con acceso peatonal (uso público)")
            cbdesc.Items.Add("Con acceso sólo para mantención")


        End If
    End Sub

    Private Sub Label3_Click(sender As Object, e As EventArgs) Handles Label3.Click

    End Sub

    Private Sub Label6_Click(sender As Object, e As EventArgs) Handles Label6.Click

    End Sub

    Private Sub TextBox1_TextChanged(sender As Object, e As EventArgs) Handles TextBox1.TextChanged

    End Sub

    Private Sub Label7_Click(sender As Object, e As EventArgs) Handles Label7.Click

    End Sub

    Private Sub ComboBox1_SelectedIndexChanged(sender As Object, e As EventArgs) Handles cbelem.SelectedIndexChanged

    End Sub

    Private Sub TextBox4_TextChanged(sender As Object, e As EventArgs) Handles TextBox4.TextChanged

    End Sub

    Private Sub a_TextChanged(sender As Object, e As EventArgs) Handles a.TextChanged
        If cbelem.Text = "Columnas interiores" Then
            kll = 4.0
        ElseIf cbelem.Text = "Columnas exteriores sin losas en voladizo" Then
            kll = 4.0
        ElseIf cbelem.Text = "Columnas de borde con losas en voladizos" Then
            kll = 3.0
        ElseIf cbelem.Text = "Columnas de esquina con losas en voladizo" Then
            kll = 2.0
        ElseIf cbelem.Text = "Vigas de borde sin losas en voladizo" Then
            kll = 2.0
        ElseIf cbelem.Text = "Vigas interiores" Then
            kll = 2.0
        ElseIf cbelem.Text = "Vigas de borde con losas en voladizo" Then
            kll = 1.0
        ElseIf cbelem.Text = "Vigas en voladizo" Then
            kll = 1.0
        ElseIf cbelem.Text = "Losas en una dirección" Then
            kll = 1.0
        ElseIf cbelem.Text = "Losas e dos direcciones" Then
            kll = 1.0
        ElseIf cbelem.Text = "Elementos sin sistemas de transferencia contínua del corte perpendicular a la luz" Then
            kll = 1.0

        End If

    End Sub

    Private Sub Button1_Click(sender As Object, e As EventArgs) Handles Button1.Click
        Try
            If cbdesc.Text = "Área de Lectura" And cbedi.Text = "Biblioteca" Then
                TextBox1.Text = "3.0"
                TextBox2.Text = "4.5"
            ElseIf cbdesc.Text = "Apilamiento de archivos <1,8m" And cbedi.Text = "Biblioteca" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "4.5"
            ElseIf cbdesc.Text = "Apilamiento extra por cada 0,3m adicionales" And cbedi.Text = "Biblioteca" Then
                TextBox1.Text = "0.5"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Pasillos" And cbedi.Text = "Biblioteca" Then
                TextBox1.Text = "4.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Áreas de mercadería liviana" And cbedi.Text = "Bodegas" Then
                TextBox1.Text = "6.0"
                TextBox2.Text = "4.5"
            ElseIf cbdesc.Text = "Áreas de mercadería pesada" And cbedi.Text = "Bodegas" Then
                TextBox1.Text = "12.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Áreas de celda" And cbedi.Text = "Cárceles" Then
                TextBox1.Text = "2.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Pasillos" And cbedi.Text = "Cárceles" Then
                TextBox1.Text = "4.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Salas de Clases" And cbedi.Text = "Escuelas" Then
                TextBox1.Text = "3.0"
                TextBox2.Text = "4.5"
            ElseIf cbdesc.Text = "Pasillos" And cbedi.Text = "Escuelas" Then
                TextBox1.Text = "4.0"
                TextBox2.Text = "4.5"
            ElseIf cbdesc.Text = "Vehículos livianos" And cbedi.Text = "Estacionamientos" Then
                TextBox1.Text = "3.0"
                TextBox2.Text = "13.5"
            ElseIf cbdesc.Text = "Buses, camiones y otros vehículos pesados" And cbedi.Text = "Estacionamientos" Then
                TextBox1.Text = ">12.0"
                TextBox2.Text = ">36"
                cbelem.Enabled = False
                a.Enabled = False
                Button2.Enabled = False
                TextBox4.Enabled = False
            ElseIf cbdesc.Text = "Industria liviana" And cbedi.Text = "Fábricas" Then
                TextBox1.Text = "6.0"
                TextBox2.Text = "9.0"
            ElseIf cbdesc.Text = "Industria pesada" And cbedi.Text = "Fábricas" Then
                TextBox1.Text = "12.0"
                TextBox2.Text = "13.5"
            ElseIf cbdesc.Text = "Áreas de hospitalización" And cbedi.Text = "Hospitales" Then
                TextBox1.Text = "2.0"
                TextBox2.Text = "4.5"
            ElseIf cbdesc.Text = "Laboratorios/quirófanos" And cbedi.Text = "Hospitales" Then
                TextBox1.Text = "3.0"
                TextBox2.Text = "4.5"
            ElseIf cbdesc.Text = "Pasillos y salas de espera" And cbedi.Text = "Hospitales" Then
                TextBox1.Text = "4.0"
                TextBox2.Text = "4.5"
            ElseIf cbdesc.Text = "Habitaciones" And cbedi.Text = "Hoteles" Then
                TextBox1.Text = "2.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Áreas públicas y sus pasillos" And cbedi.Text = "Hoteles" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Con asientos fijos" And cbedi.Text = "Iglesias" Then
                TextBox1.Text = "3.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Con asientos móviles" And cbedi.Text = "Iglesias" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Privadas sin equipos" And cbedi.Text = "Oficinas" Then
                TextBox1.Text = "2.5"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Públicas o privadas con equipos" And cbedi.Text = "Oficinas" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Correores" And cbedi.Text = "Oficinas" Then
                TextBox1.Text = "4.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Áreas con asientos fijos" And cbedi.Text = "Teatros/estadios" Then
                TextBox1.Text = "3.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Áreas con asientos móviles o sin asientos" And cbedi.Text = "Teatros/estadios" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Áreas para escenarios" And cbedi.Text = "Teatros/estadios" Then
                TextBox1.Text = "7.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Áreas de general, lobbies, plataformas, boleterias, galerías y gradas" And cbedi.Text = "Teatros/estadios" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Pisos principales y balcones" And cbedi.Text = "Gimnasios" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Gradas/terrazas/accesos" And cbedi.Text = "Gimnasios" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Áreas para ventas al por menor" And cbedi.Text = "Tiendas" Then
                TextBox1.Text = "4.0"
                TextBox2.Text = "4.5"
            ElseIf cbdesc.Text = "Áreas para ventas al por mayor" And cbedi.Text = "Tiendas" Then
                TextBox1.Text = "6.0"
                TextBox2.Text = "4.5"
            ElseIf cbdesc.Text = "Bodegas de elementos livianos" And cbedi.Text = "Tiendas" Then
                TextBox1.Text = "6.0"
                TextBox2.Text = "4.5"
            ElseIf cbdesc.Text = "Bodegas de elementos pesados" And cbedi.Text = "Tiendas" Then
                TextBox1.Text = "12.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Áreas de uso general" And cbedi.Text = "Viviendas" Then
                TextBox1.Text = "2.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Dormitorios y buhardillas habitables" And cbedi.Text = "Viviendas" Then
                TextBox1.Text = "2.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Balcones que no excedan los 10 m2" And cbedi.Text = "Viviendas" Then
                TextBox1.Text = "3.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Entretecho con almacenaje" And cbedi.Text = "Viviendas" Then
                TextBox1.Text = "1.5"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Corredores/lugares de uso público" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Balcones exteriores" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Aceras, accesos vehículares y patios sujetos a maniobras de camiones" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "12.0"
                TextBox2.Text = "36"
            ElseIf cbdesc.Text = "Calzadas vehicular" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "Autoridad competente"
                TextBox2.Text = "Autoridad competente"
            ElseIf cbdesc.Text = "Sala de juegos, incluyendo bolos y billares o similares" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "4.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Pasarelas de mantenimiento" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "2.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Pasarelas y plataformas elevadas de uso público" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "4.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Escape de incendios" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Escaleras y vías de evacuación" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Parque de diversiones" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Salas para equipos computacionales" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "4.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Tribunales de justicia" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "1.35"
            ElseIf cbdesc.Text = "Parrilla de piso en sala de máquina ascensores (en área 2,6 m2)" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Museos" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Áreas para fiestas y bailes" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Comedores y restaurantes" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Escaleras de gato para acceso de mantención" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "2.0"
                TextBox2.Text = "1.35"
            ElseIf cbdesc.Text = "Cocina y lavandería" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Estacionamiento de tren o metro" And cbedi.Text = "Lugares especiales de uso público" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Con acceso peatonal (uso privado)" And cbedi.Text = "Techos" Then
                TextBox1.Text = "2.0"
                TextBox2.Text = "0"
            ElseIf cbdesc.Text = "Con acceso peatonal (uso público)" And cbedi.Text = "Techos" Then
                TextBox1.Text = "5.0"
                TextBox2.Text = "0"
                'ElseIf cbdesc.Text = "Con acceso sólo para mantención" And cbedi.Text = "Techos" Then
            Else
                TextBox1.Text = "1.0"
                TextBox2.Text = "0"
            End If
        Catch ex As Exception
            MessageBox.Show("Error al ingresar los datos", caption:="Error al leer datos")
        End Try
    End Sub

    Private Sub Button2_Click_1(sender As Object, e As EventArgs) Handles Button2.Click
        Try
            area = Convert.ToSingle(a.Text)
            l0 = Convert.ToSingle(TextBox1.Text)
            l = l0 * (0.25 + 4.75 / (Math.Pow(Convert.ToSingle(kll) * area, 0.5)))
            If l > l0 Then
                l = l0
            End If
            TextBox4.Text = Convert.ToString(l)
        Catch ex As Exception
            MessageBox.Show("Error al ingresar los datos", caption:="Error al leer datos")
        End Try
    End Sub

    Private Sub Button6_Click(sender As Object, e As EventArgs) Handles Button6.Click

    End Sub

    Private Sub Button8_Click(sender As Object, e As EventArgs)

    End Sub

    Private Sub Button5_Click(sender As Object, e As EventArgs) Handles Button5.Click
        Try

            DataGridView1.Rows.Clear()
            DataGridView2.Rows.Clear()
            DataGridView3.Rows.Clear()
            DataGridView4.Rows.Clear()
            If CatS.Text = "Categoría I" Then
                I_S = 0.6
            ElseIf CatS.Text = "Categoría II" Then
                I_S = 1.0
            Else
                I_S = 1.2
            End If
            If ZonaS.Text = "1" Then
                A_0 = 0.2
            ElseIf ZonaS.Text = "2" Then
                A_0 = 0.3
            Else
                A_0 = 0.4
            End If
            If SueloS.Text = "Suelo A" Then
                S_S = 0.9
                T0_S = 0.15
                TP_S = 0.2
                n_S = 1
                p_S = 2
            ElseIf SueloS.Text = "Suelo B" Then
                S_S = 1
                T0_S = 0.3
                TP_S = 0.35
                n_S = 1.33
                p_S = 1.5
            ElseIf SueloS.Text = "Suelo C" Then
                S_S = 1.05
                T0_S = 0.4
                TP_S = 0.45
                n_S = 1.4
                p_S = 1.6
            ElseIf SueloS.Text = "Suelo D" Then
                S_S = 1.2
                T0_S = 0.75
                TP_S = 0.85
                n_S = 1.8
                p_S = 1.0
            ElseIf SueloS.Text = "Suelo E" Then
                S_S = 1.3
                T0_S = 1.2
                TP_S = 1.35
                n_S = 1.8
                p_S = 1.0
            Else
                S_S = 0
                T0_S = 0
                TP_S = 0
                n_S = 0
                p_S = 0
            End If
            If RS.Text = "2" Then
                C_max = 0.9 * S_S * A_0
            ElseIf RS.Text = "3" Then
                C_max = 0.6 * S_S * A_0
            ElseIf RS.Text = "4" Then
                C_max = 0.55 * S_S * A_0
            ElseIf RS.Text = "5.5" Then
                C_max = 0.4 * S_S * A_0
            Else
                C_max = 0.35 * S_S * A_0
            End If
            Txx = Convert.ToSingle(Tx.Text)
            Tyy = Convert.ToSingle(Ty.Text)
            RSs = Convert.ToSingle(RS.Text)
            PSs = Convert.ToSingle(Ps.Text)
            Co_Sx = (2.75 * S_S * A_0 * Math.Pow((TP_S / Txx), n_S)) / RSs
            Co_Sy = (2.75 * S_S * A_0 * Math.Pow((TP_S / Tyy), n_S)) / RSs
            C_min = A_0 * S_S / 6
            Q0x = Co_Sx * I_S * PSs
            Q0y = Co_Sy * I_S * PSs
            Q0_min = C_min * I_S * PSs
            Q0_max = C_max * I_S * PSs

            If Q0x > Q0_min And Q0x < Q0_max Then
                Qbasx = Q0x
            ElseIf Q0x < Q0_min Then
                Qbasx = Q0_min
            Else
                Qbasx = Q0_max
            End If
            If Q0y > Q0_min And Q0y < Q0_max Then
                Qbasy = Q0y
            ElseIf Q0y < Q0_min Then
                Qbasy = Q0_min
            Else
                Qbasy = Q0_max
            End If

            Rastx = 1 + Txx / (0.1 * T0_S + Txx / Convert.ToSingle(R0S.Text))
            Rasty = 1 + Tyy / (0.1 * T0_S + Tyy / Convert.ToSingle(R0S.Text))

            For tn = 0 To 5 Step 0.01
                alfa_S = (1 + 4.5 * Math.Pow((tn / T0_S), p_S)) / (1 + Math.Pow((tn / T0_S), 3))
                Sax = S_S * A_0 * alfa_S / (Rastx / I_S)
                SAy = S_S * A_0 * alfa_S / (Rasty / I_S)
                DataGridView2.Rows.Add(tn, Sax)
                DataGridView3.Rows.Add(tn, SAy)
            Next
            Zk(0) = 0
            Zk(1) = Zk(0) + Convert.ToSingle(TH1.Text)
            Zk(2) = Zk(1) + Convert.ToSingle(TH2.Text)
            Zk(3) = Zk(2) + Convert.ToSingle(TH3.Text)
            Zk(4) = Zk(3) + Convert.ToSingle(TH4.Text)
            Zk(5) = Zk(4) + Convert.ToSingle(TH5.Text)
            Pks(0) = Convert.ToSingle(PS1.Text)
            Pks(1) = Convert.ToSingle(PS2.Text)
            Pks(2) = Convert.ToSingle(PS3.Text)
            Pks(3) = Convert.ToSingle(PS4.Text)
            Pks(4) = Convert.ToSingle(PS5.Text)
            Zkk = 0
            zkk1 = 0
            Akpks = 0
            Htotal = Convert.ToSingle(TH1.Text) + Convert.ToSingle(TH2.Text) + Convert.ToSingle(TH3.Text) + Convert.ToSingle(TH4.Text) + Convert.ToSingle(TH5.Text)
            For nup = 1 To Convert.ToInt16(NPs.Text) Step 1
                Akpks = (Math.Sqrt(1 - Zk(nup - 1) / Htotal) - Math.Sqrt(1 - Zk(nup) / Htotal)) * Pks(nup - 1) + Akpks
            Next
            'EL 100 debe ser el Pks(nu)
            For nup = 1 To Convert.ToInt16(NPs.Text) Step 1
                Ak = Math.Sqrt(1 - Zk(nup - 1) / Htotal) - Math.Sqrt(1 - Zk(nup) / Htotal)
                Fkx = Ak * Pks(nup - 1) * Qbasx / Akpks
                Fky = Ak * Pks(nup - 1) * Qbasy / Akpks
                DataGridView4.Rows.Add(nup, Fkx, Fky)
            Next

            DataGridView1.Rows.Add(I_S, A_0, S_S, T0_S, TP_S, n_S, p_S, C_max, C_min, Q0_max, Q0_min, Q0x, Q0y, Qbasx, Qbasy)
        Catch ex As Exception
            MessageBox.Show("Error al ingresar los datos", caption:="Error al leer datos")
        End Try
    End Sub

    Private Sub TabPage2_Click(sender As Object, e As EventArgs) Handles TabPage2.Click

    End Sub

    Private Sub Button3_Click(sender As Object, e As EventArgs) Handles Button3.Click
        Try
            If ComboBox2.Text = "Construcciones en ciudad o similar" Then
                If Convert.ToSingle(h1.Text) >= 0.0 And Convert.ToSingle(h1.Text) < 15.0 Then
                    q = (Convert.ToSingle(h1.Text) - 0.0) / 15 * 0.2 + 0.55
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 15.0 And Convert.ToSingle(h1.Text) < 20.0 Then
                    q = (Convert.ToSingle(h1.Text) - 15.0) / 5 * 0.1 + 0.75
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 20.0 And Convert.ToSingle(h1.Text) < 30.0 Then
                    q = (Convert.ToSingle(h1.Text) - 20.0) / 10 * 0.1 + 0.85
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 30.0 And Convert.ToSingle(h1.Text) < 40.0 Then
                    q = (Convert.ToSingle(h1.Text) - 30.0) / 10 * 0.08 + 0.95
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 40.0 And Convert.ToSingle(h1.Text) < 50.0 Then
                    q = (Convert.ToSingle(h1.Text) - 40.0) / 10 * 0.05 + 1.03
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 50.0 And Convert.ToSingle(h1.Text) < 75.0 Then
                    q = (Convert.ToSingle(h1.Text) - 50.0) / 25 * 0.13 + 1.08
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 75.0 And Convert.ToSingle(h1.Text) < 100.0 Then
                    q = (Convert.ToSingle(h1.Text) - 75.0) / 25 * 0.1 + 1.21
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 100.0 And Convert.ToSingle(h1.Text) < 150.0 Then
                    q = (Convert.ToSingle(h1.Text) - 100.0) / 50 * 0.18 + 1.31
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 150.0 And Convert.ToSingle(h1.Text) < 200.0 Then
                    q = (Convert.ToSingle(h1.Text) - 150.0) / 50 * 0.13 + 1.49
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 200.0 And Convert.ToSingle(h1.Text) <= 300.0 Then
                    q = (Convert.ToSingle(h1.Text) - 200.0) / 100 * 0.24 + 1.62
                    q1.Text = Convert.ToString(q)
                Else
                    q1.Text = "Ir a Nch432"
                End If
            Else
                If Convert.ToSingle(h1.Text) >= 0 And Convert.ToSingle(h1.Text) < 4 Then
                    q = 0.7
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 4 And Convert.ToSingle(h1.Text) < 7 Then
                    q = (Convert.ToSingle(h1.Text) - 4) / 3 * 0.25 + 0.7
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 7 And Convert.ToSingle(h1.Text) < 10 Then
                    q = (Convert.ToSingle(h1.Text) - 7) / 3 * 0.11 + 0.95
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 10 And Convert.ToSingle(h1.Text) < 15 Then
                    q = (Convert.ToSingle(h1.Text) - 10) / 5 * 0.12 + 1.06
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 15 And Convert.ToSingle(h1.Text) < 20 Then
                    q = (Convert.ToSingle(h1.Text) - 15) / 5 * 0.0800000000000001 + 1.18
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 20 And Convert.ToSingle(h1.Text) < 30 Then
                    q = (Convert.ToSingle(h1.Text) - 20) / 10 * 0.11 + 1.26
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 30 And Convert.ToSingle(h1.Text) < 40 Then
                    q = (Convert.ToSingle(h1.Text) - 30) / 10 * 0.0799999999999998 + 1.37
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 40 And Convert.ToSingle(h1.Text) < 50 Then
                    q = (Convert.ToSingle(h1.Text) - 40) / 10 * 0.0600000000000001 + 1.45
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 50 And Convert.ToSingle(h1.Text) < 75 Then
                    q = (Convert.ToSingle(h1.Text) - 50) / 25 * 0.12 + 1.51
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 75 And Convert.ToSingle(h1.Text) < 100 Then
                    q = (Convert.ToSingle(h1.Text) - 75) / 25 * 0.0700000000000001 + 1.63
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 100 And Convert.ToSingle(h1.Text) < 150 Then
                    q = (Convert.ToSingle(h1.Text) - 100) / 50 * 0.12 + 1.7
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 150 And Convert.ToSingle(h1.Text) < 200 Then
                    q = (Convert.ToSingle(h1.Text) - 150) / 50 * 0.0899999999999999 + 1.82
                    q1.Text = Convert.ToString(q)
                ElseIf Convert.ToSingle(h1.Text) >= 200 And Convert.ToSingle(h1.Text) <= 300 Then
                    q = (Convert.ToSingle(h1.Text) - 200) / 100 * 0.18 + 1.91
                    q1.Text = Convert.ToString(q)
                Else
                    q1.Text = "Ir a Nch432"

                End If

            End If
            qtech = (Math.Sin(Convert.ToSingle(alfa.Text) * 0.0174533) * 1.2 - 0.4) * q
            TextBox7.Text = Convert.ToString(qtech)
        Catch ex As Exception
            MessageBox.Show("Error al ingresar los datos", caption:="Error al leer datos")
        End Try
    End Sub

    Private Sub AcercaDeToolStripMenuItem_Click(sender As Object, e As EventArgs) Handles AcercaDeToolStripMenuItem.Click
        MessageBox.Show(text:="Software Bases de cálculo www.jpreyes.cl - No se garantizan los resultados", caption:="Acerca de Cargas")
    End Sub

    Private Sub SalirToolStripMenuItem_Click(sender As Object, e As EventArgs) Handles SalirToolStripMenuItem.Click
        Close()
    End Sub

    Private Sub ComboBox2_SelectedIndexChanged(sender As Object, e As EventArgs) Handles ComboBox2.SelectedIndexChanged

    End Sub

    Private Sub Button4_Click(sender As Object, e As EventArgs) Handles Button4.Click
        Try
            If lati11.Text = "17-26" Then
                If Alti11.Text = "0-300" Then
                    TextBox6.Text = "0"
                ElseIf Alti11.Text = "300-600" Then
                    TextBox6.Text = "0"
                ElseIf Alti11.Text = "600-800" Then
                    TextBox6.Text = "0"
                ElseIf Alti11.Text = "800-1000" Then
                    TextBox6.Text = "0"
                ElseIf Alti11.Text = "1000-1250" Then
                    TextBox6.Text = "0"
                ElseIf Alti11.Text = "1250-1500" Then
                    TextBox6.Text = "0"
                ElseIf Alti11.Text = "1500-1750" Then
                    TextBox6.Text = "0"
                ElseIf Alti11.Text = "1750-2000" Then
                    TextBox6.Text = "0"
                ElseIf Alti11.Text = "2000-2500" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "2500-3000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "3000-3500" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "3500-4000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = ">4000" Then
                    TextBox6.Text = "S/I"
                End If
            ElseIf lati11.Text = "26-29" Then
                If Alti11.Text = "0-300" Then
                    TextBox6.Text = "0"
                ElseIf Alti11.Text = "300-600" Then
                    TextBox6.Text = "0"
                ElseIf Alti11.Text = "600-800" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "800-1000" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "1000-1250" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "1250-1500" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "1500-1750" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "1750-2000" Then
                    TextBox6.Text = "0.5"
                ElseIf Alti11.Text = "2000-2500" Then
                    TextBox6.Text = "1"
                ElseIf Alti11.Text = "2500-3000" Then
                    TextBox6.Text = "2"
                ElseIf Alti11.Text = "3000-3500" Then
                    TextBox6.Text = "3"
                ElseIf Alti11.Text = "3500-4000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = ">4000" Then
                    TextBox6.Text = "S/I"
                End If
            ElseIf lati11.Text = "29-32" Then
                If Alti11.Text = "0-300" Then
                    TextBox6.Text = "0"
                ElseIf Alti11.Text = "300-600" Then
                    TextBox6.Text = "0"
                ElseIf Alti11.Text = "600-800" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "800-1000" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "1000-1250" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "1250-1500" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "1500-1750" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "1750-2000" Then
                    TextBox6.Text = "0.5"
                ElseIf Alti11.Text = "2000-2500" Then
                    TextBox6.Text = "2"
                ElseIf Alti11.Text = "2500-3000" Then
                    TextBox6.Text = "2.6"
                ElseIf Alti11.Text = "3000-3500" Then
                    TextBox6.Text = "3.6"
                ElseIf Alti11.Text = "3500-4000" Then
                    TextBox6.Text = "4.8"
                ElseIf Alti11.Text = ">4000" Then
                    TextBox6.Text = "6.25"
                End If
            ElseIf lati11.Text = "32-34" Then
                If Alti11.Text = "0-300" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "300-600" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "600-800" Then
                    TextBox6.Text = "0.5"
                ElseIf Alti11.Text = "800-1000" Then
                    TextBox6.Text = "0.75"
                ElseIf Alti11.Text = "1000-1250" Then
                    TextBox6.Text = "1"
                ElseIf Alti11.Text = "1250-1500" Then
                    TextBox6.Text = "2"
                ElseIf Alti11.Text = "1500-1750" Then
                    TextBox6.Text = "3"
                ElseIf Alti11.Text = "1750-2000" Then
                    TextBox6.Text = "4"
                ElseIf Alti11.Text = "2000-2500" Then
                    TextBox6.Text = "5.9"
                ElseIf Alti11.Text = "2500-3000" Then
                    TextBox6.Text = "8.8"
                ElseIf Alti11.Text = "3000-3500" Then
                    TextBox6.Text = "13"
                ElseIf Alti11.Text = "3500-4000" Then
                    TextBox6.Text = "19.5"
                ElseIf Alti11.Text = ">4000" Then
                    TextBox6.Text = "S/I"
                End If
            ElseIf lati11.Text = "34-36" Then
                If Alti11.Text = "0-300" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "300-600" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "600-800" Then
                    TextBox6.Text = "0.75"
                ElseIf Alti11.Text = "800-1000" Then
                    TextBox6.Text = "1"
                ElseIf Alti11.Text = "1000-1250" Then
                    TextBox6.Text = "1.5"
                ElseIf Alti11.Text = "1250-1500" Then
                    TextBox6.Text = "3"
                ElseIf Alti11.Text = "1500-1750" Then
                    TextBox6.Text = "7"
                ElseIf Alti11.Text = "1750-2000" Then
                    TextBox6.Text = "8.6"
                ElseIf Alti11.Text = "2000-2500" Then
                    TextBox6.Text = "11"
                ElseIf Alti11.Text = "2500-3000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "3000-3500" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "3500-4000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = ">4000" Then
                    TextBox6.Text = "S/I"
                End If
            ElseIf lati11.Text = "36-38" Then
                If Alti11.Text = "0-300" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "300-600" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "600-800" Then
                    TextBox6.Text = "0.75"
                ElseIf Alti11.Text = "800-1000" Then
                    TextBox6.Text = "1"
                ElseIf Alti11.Text = "1000-1250" Then
                    TextBox6.Text = "1.5"
                ElseIf Alti11.Text = "1250-1500" Then
                    TextBox6.Text = "3"
                ElseIf Alti11.Text = "1500-1750" Then
                    TextBox6.Text = "14.5"
                ElseIf Alti11.Text = "1750-2000" Then
                    TextBox6.Text = "16.2"
                ElseIf Alti11.Text = "2000-2500" Then
                    TextBox6.Text = "18.75"
                ElseIf Alti11.Text = "2500-3000" Then
                    TextBox6.Text = "22.7"
                ElseIf Alti11.Text = "3000-3500" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "3500-4000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = ">4000" Then
                    TextBox6.Text = "S/I"
                End If
            ElseIf lati11.Text = "38-42" Then
                If Alti11.Text = "0-300" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "300-600" Then
                    TextBox6.Text = "0.25"
                ElseIf Alti11.Text = "600-800" Then
                    TextBox6.Text = "0.75"
                ElseIf Alti11.Text = "800-1000" Then
                    TextBox6.Text = "1"
                ElseIf Alti11.Text = "1000-1250" Then
                    TextBox6.Text = "1.5"
                ElseIf Alti11.Text = "1250-1500" Then
                    TextBox6.Text = "3"
                ElseIf Alti11.Text = "1500-1750" Then
                    TextBox6.Text = "4.5"
                ElseIf Alti11.Text = "1750-2000" Then
                    TextBox6.Text = "6"
                ElseIf Alti11.Text = "2000-2500" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "2500-3000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "3000-3500" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "3500-4000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = ">4000" Then
                    TextBox6.Text = "S/I"
                End If
            ElseIf lati11.Text = "42-48" Then
                If Alti11.Text = "0-300" Then
                    TextBox6.Text = "25"
                ElseIf Alti11.Text = "300-600" Then
                    TextBox6.Text = "25"
                ElseIf Alti11.Text = "600-800" Then
                    TextBox6.Text = "50"
                ElseIf Alti11.Text = "800-1000" Then
                    TextBox6.Text = "100"
                ElseIf Alti11.Text = "1000-1250" Then
                    TextBox6.Text = "150"
                ElseIf Alti11.Text = "1250-1500" Then
                    TextBox6.Text = "200"
                ElseIf Alti11.Text = "1500-1750" Then
                    TextBox6.Text = "300"
                ElseIf Alti11.Text = "1750-2000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "2000-2500" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "2500-3000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "3000-3500" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "3500-4000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = ">4000" Then
                    TextBox6.Text = "S/I"
                End If
            ElseIf lati11.Text = "48-55" Then
                If Alti11.Text = "0-300" Then
                    TextBox6.Text = "50"
                ElseIf Alti11.Text = "300-600" Then
                    TextBox6.Text = "125"
                ElseIf Alti11.Text = "600-800" Then
                    TextBox6.Text = "125"
                ElseIf Alti11.Text = "800-1000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "1000-1250" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "1250-1500" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "1500-1750" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "1750-2000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "2000-2500" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "2500-3000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "3000-3500" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = "3500-4000" Then
                    TextBox6.Text = "S/I"
                ElseIf Alti11.Text = ">4000" Then
                    TextBox6.Text = "S/I"
                End If
            End If
            pg = Convert.ToSingle(TextBox6.Text)
            If Cct.Text = "Todas las estructuras, excepto las indicadas" Then
                ct = 1.0
            ElseIf Cct.Text = "Estructuras justo sobre el punto de congelamiento" Then
                ct = 1.1
            ElseIf Cct.Text = "Estructuras no calefaccionadas" Then
                ct = 1.2
            Else
                ct = 0.85
            End If
            If Ci.Text = "Categoría I" Then
                I = 0.8
            ElseIf Ci.Text = "Categoría II" Then
                I = 1.0
            ElseIf Ci.Text = "Categoría III" Then
                I = 1.1
            Else
                I = 1.2
            End If
            If Cce.Text = "Categoría B: áreas urbanas, suburbanas y boscosas..." Then
                If Cexp.Text = "Totalmente expuesto" Then
                    ce = 0.9
                ElseIf Cexp.Text = "Parcialmente expuesto" Then
                    ce = 1.0
                Else
                    ce = 1.2
                End If
            ElseIf Cce.Text = "Categoría C: terrenos abiertos, con obstáculos dispersos..." Then
                If Cexp.Text = "Totalmente expuesto" Then
                    ce = 0.9
                ElseIf Cexp.Text = "Parcialmente expuesto" Then
                    ce = 1.0
                Else
                    ce = 1.1
                End If
            ElseIf Cce.Text = "Categoría D: planicies, áreas sin obstáculos..." Then
                If Cexp.Text = "Totalmente expuesto" Then
                    ce = 0.8
                ElseIf Cexp.Text = "Parcialmente expuesto" Then
                    ce = 0.9
                Else
                    ce = 1.0
                End If
            Else
                If Cexp.Text = "Totalmente expuesto" Then
                    ce = 0.7
                ElseIf Cexp.Text = "Parcialmente expuesto" Then
                    ce = 0.8
                Else
                    ce = 1.0
                End If
            End If
            If Ccs.Text = "Superficie lisas sin obstáculos" Then
                If ct <= 1.0 Then
                    If Convert.ToSingle(inc.Text) < 5 Then
                        cs = 1.0
                    ElseIf Convert.ToSingle(inc.Text) > 70 Then
                        cs = 0.0
                    Else
                        incx = Convert.ToSingle(inc.Text)
                        incx1 = 5
                        incx2 = 70
                        incy1 = 1
                        cs = (incx2 - incx) / (incx2 - incx1) * incy1
                    End If
                ElseIf ct = 1.1 Then
                    If Convert.ToSingle(inc.Text) < 10 Then
                        cs = 1.0
                    ElseIf Convert.ToSingle(inc.Text) > 70 Then
                        cs = 0.0
                    Else
                        incx = Convert.ToSingle(inc.Text)
                        incx1 = 10
                        incx2 = 70
                        incy1 = 1
                        cs = (incx2 - incx) / (incx2 - incx1) * incy1
                    End If
                Else
                    If Convert.ToSingle(inc.Text) < 15 Then
                        cs = 1.0
                    ElseIf Convert.ToSingle(inc.Text) > 70 Then
                        cs = 0.0
                    Else
                        incx = Convert.ToSingle(inc.Text)
                        incx1 = 15
                        incx2 = 70
                        incy1 = 1
                        cs = (incx2 - incx) / (incx2 - incx1) * incy1
                    End If
                End If
            ElseIf Ccs.Text = "Todas las otras superficies" Then
                If ct <= 1.0 Then
                    If Convert.ToSingle(inc.Text) < 30 Then
                        cs = 1.0
                    ElseIf Convert.ToSingle(inc.Text) > 70 Then
                        cs = 0.0
                    Else
                        incx = Convert.ToSingle(inc.Text)
                        incx1 = 30
                        incx2 = 70
                        incy1 = 1
                        cs = (incx2 - incx) / (incx2 - incx1) * incy1
                    End If
                ElseIf ct = 1.1 Then
                    If Convert.ToSingle(inc.Text) < 39.5 Then
                        cs = 1.0
                    ElseIf Convert.ToSingle(inc.Text) > 70 Then
                        cs = 0.0
                    Else
                        incx = Convert.ToSingle(inc.Text)
                        incx1 = 39.5
                        incx2 = 70
                        incy1 = 1
                        cs = (incx2 - incx) / (incx2 - incx1) * incy1
                    End If
                Else
                    If Convert.ToSingle(inc.Text) < 45 Then
                        cs = 1.0
                    ElseIf Convert.ToSingle(inc.Text) > 70 Then
                        cs = 0.0
                    Else
                        incx = Convert.ToSingle(inc.Text)
                        incx1 = 45
                        incx2 = 70
                        incy1 = 1
                        cs = (incx2 - incx) / (incx2 - incx1) * incy1
                    End If
                End If
            Else
                cs = 1.0
            End If
            pf = 0.7 * ce * ct * cs * I * pg
            TextBox3.Text = Convert.ToString(pf)
        Catch ex As Exception
            MessageBox.Show("Error al ingresar los datos", caption:="Error al leer datos")
        End Try
    End Sub

    Private Sub Label31_Click(sender As Object, e As EventArgs) Handles Label31.Click

    End Sub

    Private Sub TextBox6_TextChanged(sender As Object, e As EventArgs) Handles TextBox6.TextChanged

    End Sub
End Class
