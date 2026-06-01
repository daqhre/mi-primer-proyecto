import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  usuario: any = {};
  fotoPerfil: string = '';
  productos: any[] = [
    {
      id: 1,
      nombre: 'Gasan',
      descripcion: 'Gas de alta calidad de la marca Gasan. Cilindros disponibles de 10kg, 20kg y 45kg.',
      precio: 100.00
    },
    {
      id: 2,
      nombre: 'Gas País',
      descripcion: 'Gas País: la marca líder en distribución de gas licuado en el país. Confiabilidad garantizada.',
      precio: 105.00
    },
    {
      id: 3,
      nombre: 'Vida Gas',
      descripcion: 'Vida Gas ofrece gas licuado premium con estándares internacionales de seguridad y calidad.',
      precio: 110.00
    },
    {
      id: 4,
      nombre: 'Rosco Gas',
      descripcion: 'Rosco Gas: proveedor confiable con años de experiencia en el mercado de gas licuado.',
      precio: 105.00
    },
    {
      id: 5,
      nombre: 'Gasan Especial',
      descripcion: 'Línea especial de Gasan con mezcla optimizada para mejor rendimiento en cocinas.',
      precio: 100.00
    },
    {
      id: 6,
      nombre: 'Gas País Premium',
      descripcion: 'Producto premium de Gas País con aditivos para mayor limpieza en la combustión.',
      precio: 120.00
    }
  ];

  // Variables para el modal de compra
  mostrarModalCompra: boolean = false;
  mostrarModalEliminar: boolean = false;
  cargandoCompra: boolean = false;
  cargandoEliminar: boolean = false;
  cargandoQueja: boolean = false;
  idFacturaAEliminar: number | null = null;
  productoSeleccionado: any = null;
  cantidadPipetas: number = 1;
  tamanioPipeta: string = 'x100';
  tamanios: string[] = ['x100', 'x40', 'x30', 'x20', 'x10'];

  // Variables para facturación
  facturas: any[] = [];
  certificados: any[] = [];

  fechaActualCalendario: Date = new Date();
  hoyReal: Date = new Date();
  diasCalendario: any[] = [];
  mesesAnio: string[] = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  diasSemana: string[] = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Configuración de promociones semanales recurrentes
  promocionesSemanales: any = {
    1: { titulo: 'Lunes de Hogar', aplicableA: 'x10', descuento: 0.10, color: '#ff4d4d' },
    2: { titulo: 'Martes de Ahorro', aplicableA: 'x20', descuento: 0.10, color: '#ff944d' },
    3: { titulo: 'Miércoles Especial', aplicableA: 'x30', descuento: 0.15, color: '#ffdb4d' },
    4: { titulo: 'Jueves de Negocio', aplicableA: 'x40', descuento: 0.10, color: '#4dff88' },
    5: { titulo: 'Viernes Premium', aplicableA: 'x100', descuento: 0.20, color: '#4d94ff' },
    6: { titulo: 'Sábado de Parrilla', aplicableA: 'x20', descuento: 0.05, color: '#ff944d' },
    0: { titulo: 'Domingo Familiar', aplicableA: 'x40', descuento: 0.05, color: '#4dff88' }
  };

  promociones: any[] = [
    { fecha: '31', titulo: 'Super Cierre de Mes', descripcion: '10% de descuento en todas las referencias.', aplicableA: 'todas', descuento: 0.10 }
  ];

  verSeccionFacturas: boolean = false;
  mostrarModalISO14001: boolean = false;
  mostrarModalISO45001: boolean = false;
  mostrarModalISO27001: boolean = false;
  verSeccionNormas: boolean = false;
  verSeccionQuejas: boolean = false;
  verSeccionCertificados: boolean = false;
  verSeccionPolitica: boolean = false;
  verSeccionCalendario: boolean = false;
  mostrarModalFlujogramaISO9001: boolean = false;
  verPromosHoy: boolean = false;
  verSeccionBackup: boolean = false;
  mostrarModalQuejaExito: boolean = false;

  // Detalle de factura
  mostrarModalFactura: boolean = false;
  facturaSeleccionada: any = null;

  // Variables para quejas y reclamos
  queja = {
    tipo: '',
    mensaje: ''
  };
  mensajeQueja: string = '';
  diasRespuesta: number = 2;

  // Variables para certificados
  certificado = {
    tipo: '',
    archivo: null as File | null
  };
  mensajeCertificado: string = '';

  // Muestra una advertencia si el usuario intenta cerrar o refrescar la página
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    $event.returnValue = true;
  }

  private unregisterPopState: (() => void) | undefined;

  constructor(
    private router: Router, 
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private platformLocation: PlatformLocation
  ) {
    // Detectamos cuando el usuario pulsa el botón de "atrás" del navegador
    this.unregisterPopState = this.platformLocation.onPopState(() => {
      const confirmacion = confirm("¿Estás seguro de querer salir? Si confirmas, se cerrará automáticamente la sesión.");
      if (confirmacion) {
        this.logout();
      } else {
        // Si cancela, volvemos a empujar el estado para que el usuario permanezca en el Home
        window.history.pushState(null, '', window.location.href);
      }
    });
  }

  ngOnInit() {
    // Agregamos un estado extra al entrar para capturar el primer intento de retroceso
    window.history.pushState(null, '', window.location.href);

    // Recuperar los datos del usuario de localStorage
    const usuarioGuardado = localStorage.getItem('usuarioActual');
    if (usuarioGuardado) {
      this.usuario = JSON.parse(usuarioGuardado);
    } else {
      // Si no hay usuario logueado, redirigir al login
      this.router.navigate(['/login']);
    }

    // Recuperar foto del localStorage si existe
    const fotoGuardada = localStorage.getItem('fotoPerfil');
    if (fotoGuardada) {
      this.fotoPerfil = fotoGuardada;
    }

    // Cargar facturas del usuario desde el backend
    this.cargarFacturas();

    // Cargar certificados
    this.cargarCertificados();

    // Inicializar el calendario de promociones
    this.generarCalendario();
  }

  ngOnDestroy() {
    // Limpiamos el escuchador global de popstate al salir del Home
    if (this.unregisterPopState) {
      this.unregisterPopState();
    }
  }

  generarCalendario() {
    const year = this.fechaActualCalendario.getFullYear();
    const month = this.fechaActualCalendario.getMonth();
    
    // Obtener primer día de la semana (0=Dom, 1=Lun...)
    const primerDiaSemana = new Date(year, month, 1).getDay();
    const totalDiasMes = new Date(year, month + 1, 0).getDate();
    
    this.diasCalendario = [];
    
    // Espacios vacíos antes del día 1
    for (let i = 0; i < primerDiaSemana; i++) {
      this.diasCalendario.push(null);
    }
    
    // Días del mes con sus promociones
    for (let i = 1; i <= totalDiasMes; i++) {
      const fechaStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const fechaActualDía = new Date(year, month, i);
      const diaSemana = fechaActualDía.getDay();
      
      // Lógica: Solo la segunda semana del mes (días 8 al 14) tiene promos por pipeta
      const esSemanaPromo = i >= 8 && i <= 14;
      const promoSemanal = esSemanaPromo ? this.promocionesSemanales[diaSemana] : null;

      // Promoción especial del día 31
      const promoFija = i === 31 ? this.promociones[0] : null;

      const esHoy = i === this.hoyReal.getDate() && 
                   month === this.hoyReal.getMonth() && 
                   year === this.hoyReal.getFullYear();

      this.diasCalendario.push({
        dia: i,
        promocion: promoSemanal || promoFija || null,
        esHoy: esHoy,
        color: promoFija ? '#FFD700' : (promoSemanal ? promoSemanal.color : 'transparent'),
        texto: promoFija ? '31' : (promoSemanal ? promoSemanal.aplicableA : '')
      });
    }
  }

  cambiarMes(delta: number) {
    this.fechaActualCalendario.setMonth(this.fechaActualCalendario.getMonth() + delta);
    this.fechaActualCalendario = new Date(this.fechaActualCalendario); // Clonar para forzar actualización
    this.generarCalendario();
  }

  get promocionesDelMes() {
    const year = this.fechaActualCalendario.getFullYear();
    const month = this.fechaActualCalendario.getMonth();
    const list = [];
    // Generamos el string de la fecha de hoy para comparar (Formato YYYY-MM-DD local)
    const hoyStr = `${this.hoyReal.getFullYear()}-${(this.hoyReal.getMonth() + 1).toString().padStart(2, '0')}-${this.hoyReal.getDate().toString().padStart(2, '0')}`;

    // Promo del 31 (si el mes lo tiene)
    const ultimoDiaMes = new Date(year, month + 1, 0).getDate();
    if (ultimoDiaMes >= 31) {
      const fStr = `${year}-${(month + 1).toString().padStart(2, '0')}-31`;
      list.push({
        fecha: fStr,
        titulo: this.promociones[0].titulo,
        descripcion: this.promociones[0].descripcion,
        esHoy: fStr === hoyStr
      });
    }

    // Semana de promociones (8 al 14)
    for (let d = 8; d <= 14; d++) {
      const fecha = new Date(year, month, d);
      const ds = fecha.getDay();
      const p = this.promocionesSemanales[ds];
      const fStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      list.push({
        fecha: fStr,
        titulo: p.titulo,
        descripcion: `Hoy descuento del ${p.descuento * 100}% en pipetas ${p.aplicableA}`,
        esHoy: fStr === hoyStr
      });
    }
    return list.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  togglePromosHoy() {
    this.verPromosHoy = !this.verPromosHoy;
  }

  get fechaActualEspanyol(): string {
    const diaNombre = this.diasSemana[this.hoyReal.getDay()];
    const diaNum = this.hoyReal.getDate();
    const mesNombre = this.mesesAnio[this.hoyReal.getMonth()];
    const anio = this.hoyReal.getFullYear();
    return `${diaNombre}, ${diaNum} de ${mesNombre} de ${anio}`;
  }

  get infoPromocionHoy() {
    const promo = this.getPromocionHoy();
    if (!promo) return null;

    // Si es promoción semanal (que no tiene descripción fija en el objeto), generamos una dinámica
    if (!promo.descripcion) {
      return {
        titulo: promo.titulo,
        descripcion: `¡Hoy tenemos un ${promo.descuento * 100}% de descuento especial en todas las pipetas tamaño ${promo.aplicableA}!`
      };
    }
    return promo;
  }

  getPromocionHoy() {
    const dia = this.hoyReal.getDate();
    // Prioridad 1: Día 31
    if (dia === 31) return this.promociones[0];

    // Prioridad 2: Semana de promo (8-14)
    if (dia >= 8 && dia <= 14) {
      return this.promocionesSemanales[this.hoyReal.getDay()];
    }
    return null;
  }

  get descuentoActivo(): number {
    const promo = this.getPromocionHoy();
    if (promo && (promo.aplicableA === this.tamanioPipeta || promo.aplicableA === 'todas')) {
      return promo.descuento;
    }
    return 0;
  }

  cargarFacturas() {
    this.http.get(`http://localhost:3000/facturas?userId=${this.usuario.id}`, { responseType: 'json' }).subscribe({
      next: (data: any) => {
        this.facturas = data;
        this.cdr.detectChanges(); // Forzar actualización de la vista
      },
      error: (err) => {
        console.log('Error al cargar facturas:', err);
      }
    });
  }

  cargarCertificados() {
    if (!this.usuario || !this.usuario.id) {
      console.log('No hay ID de usuario disponible para cargar certificados');
      return;
    }

    this.http.get(`http://localhost:3000/certificados?userId=${this.usuario.id}`, { responseType: 'json' }).subscribe({
      next: (data: any) => {
        this.certificados = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('Error al cargar certificados:', err);
      }
    });
  }

  comprarProducto(producto: any) {
    this.productoSeleccionado = producto;
    this.cantidadPipetas = 1;
    this.tamanioPipeta = 'x100';
    this.mostrarModalCompra = true;
  }

  // --- Nuevos Getters para el Desglose de Factura ---
  get subtotalCompra(): number {
    if (!this.productoSeleccionado) return 0;
    const kilos = parseInt(this.tamanioPipeta.substring(1), 10);
    const factor = kilos / 10;
    return (this.productoSeleccionado.precio * factor) * this.cantidadPipetas;
  }

  get montoDescuento(): number {
    return this.subtotalCompra * this.descuentoActivo;
  }

  get baseConDescuento(): number {
    return this.subtotalCompra - this.montoDescuento;
  }

  get ivaCalculado(): number {
    return this.baseConDescuento * 0.19;
  }

  get totalCalculado(): number {
    return this.baseConDescuento + this.ivaCalculado;
  }

  cerrarModal() {
    this.mostrarModalCompra = false;
    this.productoSeleccionado = null;
  }

  confirmarCompra() {
    if (this.cargandoCompra) return;
    this.cargandoCompra = true;
    this.cdr.detectChanges(); // Forzamos a que el botón muestre "Procesando..." inmediatamente

    const promo = this.getPromocionHoy();
    const nombrePromo = (this.descuentoActivo > 0 && promo) ? promo.titulo : 'Sin promoción';

    const compraData = {
      userId: this.usuario.id,
      producto: this.productoSeleccionado.nombre,
      cantidad: this.cantidadPipetas,
      tamanio: this.tamanioPipeta,
      subtotal: this.subtotalCompra,
      iva: this.ivaCalculado,
      descuento: this.montoDescuento,
      total: this.totalCalculado,
      promocion: nombrePromo
    };

    this.http.post('http://localhost:3000/comprar', compraData, { responseType: 'text' }).subscribe({
      next: (res) => {
        this.cerrarModal();
        this.toggleVista('factura');
        this.cargarFacturas();
        this.cargandoCompra = false;
        this.cdr.detectChanges(); // Forzamos el refresco de la UI
      },
      error: (err) => {
        this.cargandoCompra = false;
        console.log('Error al comprar:', err);
        alert('Error al realizar la compra.');
        this.cdr.detectChanges();
      }
    });
  }

  eliminarFactura(facturaId: number) {
    this.idFacturaAEliminar = facturaId;
    this.mostrarModalEliminar = true;
  }

  confirmarEliminacion() {
    if (this.idFacturaAEliminar && !this.cargandoEliminar) {
      this.cargandoEliminar = true;
      this.cdr.detectChanges(); // Mostramos estado de carga en el modal de eliminación

      this.http.delete(`http://localhost:3000/facturas/${this.idFacturaAEliminar}`, { responseType: 'text' }).subscribe({
        next: () => {
          this.cargandoEliminar = false;
          this.cerrarModalEliminar();
          this.cargarFacturas();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.cargandoEliminar = false;
          console.log('Error al eliminar:', err);
          this.cerrarModalEliminar();
          this.cdr.detectChanges();
        }
      });
    }
  }

  cerrarModalEliminar() {
    this.mostrarModalEliminar = false;
    this.idFacturaAEliminar = null;
  }

  verDetalleFactura(factura: any) {
    this.facturaSeleccionada = factura;
    this.mostrarModalFactura = true;
  }

  cerrarModalFactura() {
    this.mostrarModalFactura = false;
    this.facturaSeleccionada = null;
  }

  imprimirFactura() {
    window.print();
  }

  enviarQueja() {
    if (!this.queja.tipo || !this.queja.mensaje) {
      this.mensajeQueja = 'Por favor, completa todos los campos.';
      return;
    }

    this.cargandoQueja = true;
    this.cdr.detectChanges();

    const tipoEnviado = this.queja.tipo; // Capturamos el tipo antes de resetear el objeto

    const quejaData = {
      userId: this.usuario.id,
      tipo: tipoEnviado,
      mensaje: this.queja.mensaje
    };

    this.http.post('http://localhost:3000/quejas', quejaData, { responseType: 'text' }).subscribe({
      next: res => {
        const mensajes: any = {
          'queja': 'Su queja fue enviada con éxito.',
          'reclamo': 'Su reclamo fue enviado con éxito.',
          'felicitacion': 'Su felicitación fue enviada con éxito.',
          'sugerencia': 'Su sugerencia fue enviada con éxito.'
        };
        this.mensajeQueja = mensajes[tipoEnviado] || 'Mensaje enviado exitosamente.';
        this.diasRespuesta = 2;

        this.queja = { tipo: '', mensaje: '' };
        this.cargandoQueja = false;
        this.mostrarModalQuejaExito = true;
        this.cdr.detectChanges();
      },
      error: err => {
        this.mensajeQueja = 'Error al enviar la queja.';
        this.cargandoQueja = false;
        this.cdr.detectChanges();
      }
    });
  }

  cerrarModalQuejaExito() {
    this.mostrarModalQuejaExito = false;
  }

  subirCertificado() {
    if (!this.certificado.tipo || !this.certificado.archivo) {
      this.mensajeCertificado = 'Por favor, selecciona el tipo y el archivo para subir.';
      return;
    }

    const formData = new FormData();
    formData.append('userId', this.usuario.id.toString());
    formData.append('tipo', this.certificado.tipo);
    if (this.certificado.archivo) {
      formData.append('archivo', this.certificado.archivo);
    }

    this.http.post('http://localhost:3000/certificados', formData, { responseType: 'text' }).subscribe({
      next: res => {
        this.mensajeCertificado = 'Certificado subido exitosamente.';
        this.certificado = { tipo: '', archivo: null };
        this.cargarCertificados(); // Actualizar la lista tras subir
        this.cdr.detectChanges();
      },
      error: err => {
        this.mensajeCertificado = 'Error al subir el certificado.';
        this.cdr.detectChanges();
      }
    });
  }

  onArchivoSeleccionado(event: any) {
    this.certificado.archivo = event.target.files[0];
  }

  verArchivo(nombreArchivo: string) {
    if (nombreArchivo) {
      window.open(`http://localhost:3000/uploads/${nombreArchivo}`, '_blank');
    }
  }

  descargarBackup() {
    this.http.get(`http://localhost:3000/backup-datos/${this.usuario.id}`, { responseType: 'blob' }).subscribe({
      next: (data: any) => {
        const blob = new Blob([data], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Copia_Seguridad_MundiGas_${this.usuario.nombre}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        alert('Error al generar la copia de seguridad.');
      }
    });
  }

  solicitarBackup() {
    this.http.post('http://localhost:3000/backup', { userId: this.usuario.id }, { responseType: 'text' }).subscribe(
      res => {
        alert('Solicitud de copia de seguridad enviada. Recibirás un correo electrónico cuando esté lista.');
      },
      err => {
        alert('Error al solicitar la copia de seguridad.');
      }
    );
  }

  toggleVista(seccion: string) {
    this.verSeccionFacturas = (seccion === 'factura');
    this.verSeccionNormas = (seccion === 'normas');
    this.verSeccionQuejas = (seccion === 'quejas');
    this.verSeccionCertificados = (seccion === 'certificados');
    this.verSeccionPolitica = (seccion === 'politica');
    this.verSeccionBackup = (seccion === 'backup');
    this.verSeccionCalendario = (seccion === 'calendario');
  }

  logout() {
    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('fotoPerfil');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  abrirFlujogramaISO9001() {
    this.mostrarModalFlujogramaISO9001 = true;
  }

  cerrarModalFlujogramaISO9001() {
    this.mostrarModalFlujogramaISO9001 = false;
  }

  abrirModalISO14001() {
    this.mostrarModalISO14001 = true;
  }

  cerrarModalISO14001() {
    this.mostrarModalISO14001 = false;
  }

  abrirModalISO45001() {
    this.mostrarModalISO45001 = true;
  }

  cerrarModalISO45001() {
    this.mostrarModalISO45001 = false;
  }

  abrirModalISO27001() {
    this.mostrarModalISO27001 = true;
  }

  cerrarModalISO27001() {
    this.mostrarModalISO27001 = false;
  }

  // Método para actualizar la foto de perfil
  onFotoSeleccionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fotoPerfil = e.target.result;
        // Guardar la foto en localStorage también
        localStorage.setItem('fotoPerfil', this.fotoPerfil);
        this.cdr.detectChanges(); // Forzar actualización de la vista inmediata
      };
      reader.readAsDataURL(file);
    }
  }
}
