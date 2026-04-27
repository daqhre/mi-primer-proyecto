import { Component } from '@angular/core';
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
export class Login {

  usuario = { email: '', password: '' };
  mensaje = '';

  constructor(private usuarioService: UsuariosService, private router: Router) { }

  login() {
    if (!this.usuario.email || !this.usuario.password) {
      this.mensaje = 'Por favor completa email y contraseña.';
      return;
    }

    this.mensaje = 'Ingresando...';
    console.log('Datos que envío al backend:', this.usuario);
    this.usuarioService.login(this.usuario).subscribe({
      next: (res: any) => {
        console.log('Respuesta del backend:', res);
        if (res && res.usuario) {
          localStorage.setItem('usuarioActual', JSON.stringify(res.usuario));
          this.router.navigate(['/home']);
        } else {
          this.mensaje = 'Error en la respuesta del servidor';
        }
      },
      error: err => {
        console.log('Error del backend:', err);
        this.mensaje = err.error?.error || 'Error al conectar con el servidor';
      }
    });
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }

  irARecuperarClave() {
    this.router.navigate(['/recuperar-password']);
  }
}
