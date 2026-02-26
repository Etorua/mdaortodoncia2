"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function HomePage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [customLoginBg, setCustomLoginBg] = useState<string | null>(null);
  const [maskUser, setMaskUser] = useState(false); // false = show text, true = visually masked
  const [showPassword, setShowPassword] = useState(false); // false = hide password, true = show password

  useEffect(() => {
    // Cambiar título de la página
    document.title = '🔐🦷 Acceso - Consultorio Dental SONRISAS';
    
    // Este código se ejecuta solo en el cliente
    const bg = localStorage.getItem('customLoginBg');
    if (bg) {
      setCustomLoginBg(bg);
    }
  }, []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    
    // Validación del lado del cliente
    if (!email.trim() || !password.trim()) {
      setMessage("Por favor complete todos los campos");
      setLoading(false);
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage("Por favor ingrese un email válido");
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔐 Enviando solicitud de login...');
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password 
        }),
      });

      const data = await res.json();
      console.log('📡 Respuesta del servidor:', { ok: data.ok, message: data.message });

      if (!res.ok) {
        setMessage(data.message || "Error en el inicio de sesión");
        setLoading(false);
        return;
      }

      if (data?.ok && data?.user) {
        console.log('✅ Login exitoso, guardando usuario...');
        
        try { 
          localStorage.setItem("currentUser", JSON.stringify(data.user)); 
          console.log('💾 Usuario guardado en localStorage');
        } catch (storageErr) {
          console.warn('⚠️ Error guardando en localStorage:', storageErr);
        }
        
        // Mantener loading activo durante la redirección
        console.log('🚀 Redirigiendo a:', `/${data.user.role}`);
        
        // Pequeño delay para mostrar feedback visual
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Redirect según el rol del usuario
        const role = data.user.role || 'user';
        router.push(`/${role}`);
      } else {
        setMessage(data.message || "Respuesta del servidor inválida");
        setLoading(false);
      }
    } catch (err) {
      console.error('🔥 Error de conexión:', err);
      setMessage("Error de conexión con el servidor. Verifique su conexión a internet.");
      setLoading(false);
    }
  }

  // Prueba de comunicación con backend
  async function handlePing() {
    setMessage('');
    try {
      const res = await fetch('/api/ping');
      const data = await res.json();
      if (data.ok) {
        setMessage('✅ Comunicación con backend exitosa: ' + data.message);
      } else {
        setMessage('❌ Backend respondió pero sin éxito.');
      }
    } catch (err) {
      setMessage('❌ No se pudo comunicar con el backend.');
    }
  }

  return (
    <div className={styles.root} style={{ backgroundImage: customLoginBg ? `url('${customLoginBg}')` : `url('/images/hero-bg-gobierno.jpg')` }}>
      <div className={styles.overlay} />
      <div className={styles.hero}>
  <div className={styles.heroInner}>
          <div className={styles.organizationTitle}>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: '0 0 16px 0', textShadow: '0 2px 4px rgba(0,0,0,0.3)', letterSpacing: '0.5px' }}>
              CONSULTORIO DENTAL "SONRISAS"
            </h1>
          </div>
          <div className={styles.title}>SISTEMA DE GESTIÓN Y MANTENIMIENTO</div>
          <div className={styles.lead}>Sistema de recepción de solicitudes de mantenimiento de las y los servidores</div>
          <div style={{ marginTop: 18 }} className={styles.muted}>Gran Plaza, Blvr. P.º Río Sonora Nte. 76-Int. 207, Proyecto Rio Sonora Hermosillo XXI, 83270, Hermosillo, Sonora, México.</div>
          <div style={{ marginTop: 12 }}><a href="#" style={{ color: 'white', textDecoration: 'underline' }}>Avisos de privacidad</a></div>
        </div>
      </div>

  <div className={styles.divider} />

      <div className={styles.panel}>
        <div className={`${styles.card} ${creating ? 'transparent' : ''}`}> 
          <div className={styles.iconWrap}>
            <div className={styles.iconCircle} aria-hidden>
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM6 20c0-2.21 3.58-4 6-4s6 1.79 6 4v1H6v-1z"/></svg>
            </div>
          </div>
          <div className={styles.heading}>INICIO DE SESIÓN</div>

          <form onSubmit={handleLogin} className={creating ? undefined : undefined}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Use proper autocomplete token and id/name that browsers recognize for autofill */}
              <label htmlFor="email" style={{position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden'}}>Email</label>
              {/* Keep type="email" for autofill/validation; apply visual mask via CSS when maskUser is true */}
              <input
                placeholder="Usuario"
                className={`${styles.input} ${maskUser ? styles.masked : ''}`}
                id="email"
                name="email"
                autoComplete="off"
                type="email"
                value={email}
                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                data-has-value={email.length > 0 ? "true" : "false"}
              />
              <button
                type="button"
                onClick={() => setMaskUser((v) => !v)}
                className={styles.toggleButton}
                aria-pressed={maskUser}
                aria-label={maskUser ? 'Mostrar usuario' : 'Ocultar usuario'}
              >
                {maskUser ? 'Mostrar' : 'Ocultar'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor="password" style={{position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden'}}>Contraseña</label>
              <input 
                placeholder="Contraseña" 
                className={styles.input} 
                id="password" 
                name="password" 
                autoComplete="current-password" 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                data-has-value={password.length > 0 ? "true" : "false"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className={styles.toggleButton}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                )}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <label className="checkbox" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" /> <span style={{color:'white'}}>Recordarme</span></label>
              <a href="#" style={{color:'white'}}>¿Olvidaste tu contraseña?</a>
            </div>

            <div style={{ display:'flex', justifyContent:'center', marginBottom: 12 }}>
              <button 
                className={styles.btn} 
                type="submit" 
                disabled={loading}
                style={{
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  position: 'relative'
                }}
              >
                {loading && (
                  <div className={styles.spinner} style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
              <button 
                type="button"
                style={{ marginLeft: 12, background: '#1a7f37', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                onClick={handlePing}
              >
                Probar conexión
              </button>
            </div>

            {message ? <p style={{ color: 'crimson', marginTop: 12 }}>{message}</p> : null}

            {/* Eliminado texto y botón de crear cuenta */}
            {creating ? (
              <div style={{ marginTop: 12 }}>
                <input placeholder="Nombre completo" className={styles.input} value={newName} onChange={(e) => setNewName(e.target.value)} />
                <input placeholder="Email" className={styles.input} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <input placeholder="Contraseña" className={styles.input} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
            ) : null}
          </form>
        </div>
      </div>
      
      {/* Overlay de loading completo */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid #ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <p style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '500',
            margin: 0,
            textAlign: 'center'
          }}>
            Iniciando sesión...
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '14px',
            margin: '8px 0 0 0',
            textAlign: 'center'
          }}>
            Cargando el sistema de mantenimiento
          </p>
        </div>
      )}
    </div>
  );
}
