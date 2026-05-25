import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class Home implements OnInit {
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
  verSeccionFacturas: boolean = false;
  mostrarModalISO14001: boolean = false;
  mostrarModalISO45001: boolean = false;
  mostrarModalISO27001: boolean = false;
  verSeccionNormas: boolean = false;
  verSeccionQuejas: boolean = false;
  verSeccionCertificados: boolean = false;
  verSeccionPolitica: boolean = false;
  mostrarModalFlujogramaISO9001: boolean = false;
  verSeccionBackup: boolean = false;

  // Detalle de factura
  mostrarModalFactura: boolean = false;
  facturaSeleccionada: any = null;

  // Variables para quejas y reclamos
  queja = {
    tipo: '',
    mensaje: ''
  };
  mensajeQueja: string = '';

  // Variables para certificados
  certificado = {
    tipo: '',
    archivo: null as File | null
  };
  mensajeCertificado: string = '';

  constructor(
    private router: Router, 
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
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

  get precioPorUnidad(): number {
    if (!this.productoSeleccionado) return 0;
    // Extraemos el número del tamaño (ej: 'x100' -> 100)
    const kilos = parseInt(this.tamanioPipeta.substring(1), 10);
    // Asumimos que el precio base en la lista es para 10kg, calculamos el factor
    const factor = kilos / 10;
    return this.productoSeleccionado.precio * factor;
  }

  get totalCalculado(): number {
    return this.precioPorUnidad * this.cantidadPipetas;
  }

  cerrarModal() {
    this.mostrarModalCompra = false;
    this.productoSeleccionado = null;
  }

  confirmarCompra() {
    if (this.cargandoCompra) return;
    this.cargandoCompra = true;
    this.cdr.detectChanges(); // Forzamos a que el botón muestre "Procesando..." inmediatamente

    const totalPrecio = this.totalCalculado;

    const compraData = {
      userId: this.usuario.id,
      producto: this.productoSeleccionado.nombre,
      cantidad: this.cantidadPipetas,
      tamanio: this.tamanioPipeta,
      total: totalPrecio
    };

    this.http.post('http://localhost:3000/comprar', compraData, { responseType: 'text' }).subscribe({
      next: (res) => {
        this.cerrarModal();
        this.toggleVista('factura');
        this.cargarFacturas(); // Recargar facturas después de cambiar de vista
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
          this.cerrarModalEliminar();
          this.cargandoEliminar = false;
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

    const quejaData = {
      userId: this.usuario.id,
      tipo: this.queja.tipo,
      mensaje: this.queja.mensaje
    };

    this.http.post('http://localhost:3000/quejas', quejaData, { responseType: 'text' }).subscribe({
      next: res => {
        this.mensajeQueja = 'Queja enviada exitosamente.';
        this.queja = { tipo: '', mensaje: '' };
        this.cargandoQueja = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.mensajeQueja = 'Error al enviar la queja.';
        this.cargandoQueja = false;
        this.cdr.detectChanges();
      }
    });
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
        alert('Solicitud de copia de seguridad enviada. Recibirás un email cuando esté lista.');
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
  }

  logout() {
    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('fotoPerfil');
    this.router.navigate(['/login']);
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
      };
      reader.readAsDataURL(file);
    }
  }
}
