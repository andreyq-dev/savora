# Vite - Guía de Uso para Savora

**Última actualización**: Enero 2, 2026

---

## ¿Qué es Vite?

Vite es el **dev server** y **bundler** que usamos en Savora. Proporciona:
- ⚡ Hot Module Replacement (HMR) - cambios instantáneos sin refrescar
- 📦 ES Modules nativos
- 🔄 Proxy al backend (evita CORS)
- 🚀 Builds optimizados para producción

**Versión instalada**: v6.0.3

---

## Comandos Principales

### Desarrollo (uso diario)

```powershell
# Iniciar servidor de desarrollo
cd frontend

# Opción A: pnpm (recomendado)
pnpm dev

# Opción B: npm
# npm run dev

# Opción C: npx (sin instalaciones globales; versión alineada al repo)
# npx -y pnpm@10.20.0 dev

# Servidor arranca en: http://localhost:3000
# Hot reload activado ✨
```

**¿Cuándo usar?**: TODO el tiempo que estés desarrollando frontend.

---

### Build para Producción

```powershell
# Generar archivos optimizados
pnpm build

# Alternativas
# npm run build
# npx -y pnpm@10.20.0 build

# Resultado: carpeta dist/ con HTML/CSS/JS minificados
```

**¿Cuándo usar?**: Cuando vayas a deployar a producción.

---

### Preview de Build

```powershell
# Ver cómo se ve el build de producción
pnpm preview

# Alternativas
# npm run preview
# npx -y pnpm@10.20.0 preview

# Servidor arranca en: http://localhost:4173
```

**¿Cuándo usar?**: Para probar el build antes de deployar.

---

## Configuración Actual

**Archivo**: `frontend/vite.config.js`

```javascript
{
  server: {
    port: 3000,              // Puerto del dev server
    open: true,              // Abre navegador automáticamente
    proxy: {
      '/api': {              // Redirige /api/* → http://localhost:5000/*
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
}
```

### ¿Qué hace el proxy?

**Sin proxy**:
```javascript
// ❌ Genera CORS error
axios.get('http://localhost:5000/dishes')
```

**Con proxy de Vite**:
```javascript
// ✅ Funciona perfecto
axios.get('/api/dishes')
// Vite redirige automáticamente a: http://localhost:5000/dishes
```

---

## Hot Module Replacement (HMR)

### ¿Cómo funciona?

1. Editas `styles/main.css`
2. Guardas (`Ctrl + S`)
3. **Vite detecta el cambio**
4. **Browser se actualiza SOLO** (sin refrescar página completa)
5. Cambios visibles en < 100ms ⚡

### ¿Qué archivos tienen HMR?

| Tipo de Archivo | HMR | Comportamiento |
|-----------------|-----|----------------|
| `.css` | ✅ Sí | Cambios instantáneos, no pierde estado |
| `.js` (ES Modules) | ✅ Sí | Recarga módulo específico |
| `.html` | ⚠️ Parcial | Refresca página completa |
| Imágenes | ✅ Sí | Actualiza imagen sin refrescar |

---

## Estructura de URLs

### En Desarrollo (`npm run dev`)

| URL en código | Archivo real | Servido por |
|---------------|--------------|-------------|
| `/` | `index.html` | Vite |
| `/pages/auth/login.html` | `pages/auth/login.html` | Vite |
| `/styles/main.css` | `styles/main.css` | Vite (con HMR) |
| `/scripts/core/app.js` | `scripts/core/app.js` | Vite (transpilado) |
| `/api/dishes` | → `http://localhost:5000/dishes` | Backend (via proxy) |

**Nota**: Las rutas **siempre empiezan con `/`** (relativas a la raíz del proyecto).

---

## ES Modules con Vite

### Import/Export (ahora funciona)

**Antes (sin Vite)**: No funcionaba bien en browsers
```javascript
// ❌ Problemas de CORS, paths, etc.
import { dishService } from './services/dishService.js';
```

**Ahora (con Vite)**: Funciona perfecto
```javascript
// ✅ Vite resuelve los imports automáticamente
import { dishService } from '/scripts/services/dishService.js';
import axios from 'axios'; // ✅ Node modules también funcionan
```

---

## Archivos de Configuración

### package.json

```json
{
  "scripts": {
    "dev": "vite",              // Alias para: vite serve
    "build": "vite build",      // Genera dist/
    "preview": "vite preview"   // Sirve dist/ localmente
  }
}
```

### vite.config.js

Define comportamiento de Vite:
- Puerto del servidor
- Proxy al backend
- Qué archivos incluir en el build
- Plugins adicionales (si los agregamos)

---

## Troubleshooting

### ❌ Problema: "npm run dev" no funciona

**Síntoma**: Error `'npm' is not recognized`

**Solución**:
1. Instala Node.js desde https://nodejs.org
2. Reinicia VS Code
3. Verifica: `node --version` y `npm --version`

---

### ❌ Problema: Cambios no se reflejan en el browser

**Solución**:
1. Verifica que Vite esté corriendo (`npm run dev`)
2. Mira la terminal: ¿hay errores de compilación?
3. Refresca manualmente con `Ctrl + F5` (hard refresh)
4. Si persiste: detén Vite (`Ctrl + C`) y reinicia

---

### ❌ Problema: "Cannot find module 'axios'"

**Solución**:
```powershell
cd frontend

# Recomendado (alineado al repo)
npx -y pnpm@10.20.0 install

# Alternativas
# pnpm install
# npm install
```

---

### ⚠️ Nota: No mezcles lockfiles

Este repo usa `pnpm-lock.yaml`.

- Si usas pnpm/npx pnpm: asegúrate de NO versionar `package-lock.json`.
- Si ya existe `package-lock.json`, bórralo antes de correr `pnpm install`.

---

### ❌ Problema: CORS error al llamar al backend

**Causa**: El backend no está corriendo o el proxy está mal configurado.

**Solución**:
1. Verifica que el backend esté en `http://localhost:5000`
2. En el frontend, usa `/api/dishes` en lugar de `http://localhost:5000/dishes`
3. Revisa `vite.config.js` → proxy debe estar configurado

---

## Mejores Prácticas

### ✅ DO (Hacer)

1. **Usa rutas absolutas desde la raíz**:
   ```javascript
   import { dishService } from '/scripts/services/dishService.js'; // ✅
   ```

2. **Usa el proxy para API calls**:
   ```javascript
   axios.get('/api/dishes'); // ✅ Vite redirige al backend
   ```

3. **Deja Vite corriendo mientras desarrollas**:
   - Abre terminal dedicada para `npm run dev`
   - No la cierres hasta terminar de trabajar

4. **Aprovecha el HMR**:
   - Edita CSS y ve cambios instantáneos
   - No refresques manualmente si no es necesario

---

### ❌ DON'T (No hacer)

1. **No uses rutas relativas complicadas**:
   ```javascript
   import { dishService } from '../../../services/dishService.js'; // ❌ Confuso
   ```

2. **No llames directamente al backend en producción**:
   ```javascript
   axios.get('http://localhost:5000/dishes'); // ❌ Solo funciona en local
   ```

3. **No ignores los errores de Vite**:
   - Si ves errores en la terminal, resuélvelos
   - Vite no compilará si hay errores de sintaxis

---

## Workflow Típico

### Día Normal de Desarrollo

```powershell
# 1. Abrir proyecto
cd <repo>\frontend

# 2. Iniciar Vite
npm run dev
# → Browser abre en http://localhost:3000

# 3. Editar código
# - Editas app.js
# - Guardas (Ctrl + S)
# - Browser se actualiza solo ✨

# 4. Al terminar
# Ctrl + C en la terminal de Vite para detener
```

---

## Comandos Útiles

```powershell
# Ver versión de Vite
npm list vite

# Limpiar cache de Vite (si hay problemas)
rm -r node_modules/.vite

# Reinstalar dependencias
rm -r node_modules
npm install

# Ver qué puertos están ocupados (Windows)
netstat -ano | findstr :3000
```

---

## Recursos Adicionales

- **Documentación oficial**: https://vitejs.dev
- **Guía de features**: https://vitejs.dev/guide/features.html
- **Configuración de proxy**: https://vitejs.dev/config/server-options.html#server-proxy

---

## Notas para el Equipo

- **No commitear `node_modules/`**: Ya está en `.gitignore`
- **No commitear `dist/`**: Se genera con `npm run build`
- **Sí commitear `package.json` y `package-lock.json`**: Necesarios para instalar dependencias

---

**¿Dudas sobre Vite?** Actualiza este documento con la solución cuando las resuelvas.
