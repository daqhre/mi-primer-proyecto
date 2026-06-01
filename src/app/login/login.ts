import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { UsuariosService } from '../servicios/usuarios';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {

  usuario = { email: '', password: '' };
  mensaje: string = '';
  isError: boolean = false; // Nueva variable para controlar si el mensaje es un error
  mostrarPassword: boolean = false; // Variable para controlar la visibilidad

  constructor(
    private usuarioService: UsuariosService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // Si el usuario ya está logueado, redirigir al home automáticamente
    if (localStorage.getItem('usuarioActual')) {
      this.router.navigate(['/home'], { replaceUrl: true });
    }
  }

  login() {
    if (!this.usuario.email || !this.usuario.password) {
      this.mensaje = 'Por favor completa email y contraseña.';
      this.isError = true; // Marcar como error
      return;
    }

    this.mensaje = 'Ingresando...';
    this.isError = false; // Resetear el estado de error al iniciar el proceso
    this.cdr.detectChanges();

    this.usuarioService.login(this.usuario).subscribe({
      next: (res: any) => {
        console.log('Respuesta del backend:', res);
        if (res && res.usuario) {
          localStorage.setItem('usuarioActual', JSON.stringify(res.usuario));
          // replaceUrl: true evita que el usuario pueda volver al login con el botón "atrás"
          this.router.navigate(['/home'], { replaceUrl: true });
        } else {
          setTimeout(() => {
            this.mensaje = 'Error en la respuesta del servidor';
            this.isError = true;
            this.cdr.detectChanges();
          }, 0);
        }
      },
      error: err => {
        console.error('Error detectado:', err);
        // Usamos setTimeout para forzar a Angular a refrescar la UI de inmediato
        setTimeout(() => {
          this.isError = true;
          const errorBody = err.error;
          // Captura el mensaje si es un objeto {error: '...'} o si es un string directo
          this.mensaje = (errorBody && typeof errorBody === 'object' ? (errorBody.error || errorBody.message) : errorBody) || 'Error al conectar con el servidor';
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }

  irARecuperarClave() {
    this.router.navigate(['/recuperar-password']);
  }

  togglePasswordVisibility() {
    this.mostrarPassword = !this.mostrarPassword;
  }
}
