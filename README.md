# Papelería POS — PWA de ventas

Sistema de punto de venta para papelería, instalable como app en celular o tablet.
Permite cobrar escaneando el QR del producto, dictando el código por voz, o
escribiéndolo manualmente. Funciona sin internet y sincroniza solo cuando vuelve
la conexión.

## ¿Qué incluye?

- **Vender**: escaneo QR con la cámara, dictado por voz (requiere internet) y
  captura manual como respaldo. Carrito con botones grandes, total visible y cobro.
- **Productos**: alta, edición y baja del catálogo (código, nombre, precio, existencias).
- **Etiquetas QR**: genera y descarga el código QR de cada producto (PNG) o
  imprime una hoja con varias etiquetas desde el navegador.
- **Estadísticas**: ventas de hoy / 7 días / 30 días, gráfica de ventas por día,
  productos más vendidos y alertas de stock bajo.
- **Offline-first**: usa la caché local de Firestore. Las ventas y cambios de
  inventario hechos sin internet quedan guardados en el dispositivo y se
  sincronizan automáticamente en cuanto hay conexión, sin perder información.
- Interfaz con textos grandes, botones amplios y alto contraste, pensada para
  personas de edad avanzada.

---

## 1. Crear el proyecto en Firebase (gratis)

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) y crea un proyecto nuevo.
2. En **Compilación → Firestore Database**, crea la base de datos (modo producción, la
   región más cercana a ti, por ejemplo `us-central` o `southamerica-east1`).
3. En **Compilación → Authentication**, habilita el método **Correo/contraseña**.
4. Dentro de Authentication → Users, crea manualmente tu único usuario administrador
   (el correo y contraseña con los que vas a entrar a la app).
5. En **Configuración del proyecto → General**, agrega una app **Web** (ícono `</>`).
   Copia los valores que te da (`apiKey`, `authDomain`, etc.).

## 2. Configurar el proyecto

```bash
cp .env.example .env
```

Pega en `.env` los valores que copiaste de Firebase:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 3. Reglas de seguridad de Firestore

En la consola de Firebase, ve a **Firestore Database → Reglas** y pega el contenido
del archivo `firestore.rules` incluido en este proyecto (solo permite leer/escribir
a usuarios que iniciaron sesión).

## 4. Instalar y correr en desarrollo

Necesitas [Node.js](https://nodejs.org) 18 o superior instalado.

```bash
npm install
npm run dev
```

Abre la URL que te muestre la terminal (normalmente `http://localhost:5173`).
Para probarlo desde el celular en la misma red, usa la URL de tipo `http://TU-IP:5173`
que también aparece en la terminal (nota: la cámara solo funciona en `localhost` o
en un sitio con **https**, ver siguiente sección para publicarlo).

## 5. Publicar la app (para poder instalarla en el celular)

La cámara y el micrófono solo funcionan en sitios servidos por **https**. La forma
más simple y gratuita es con Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

Cuando pregunte:
- Directorio público: `dist`
- ¿Configurar como single-page app?: **Sí**
- No sobrescribas `index.html`

Luego, cada vez que quieras actualizar la app publicada:

```bash
npm run build
firebase deploy
```

Te dará una URL tipo `https://tu-proyecto.web.app`. Ábrela desde el celular o
tablet en Chrome y usa **"Agregar a pantalla de inicio"** (o el aviso que aparece
automáticamente) para instalarla como app.

> Alternativas igual de válidas: [Vercel](https://vercel.com) o [Netlify](https://netlify.com):
> solo arrastra la carpeta `dist` generada por `npm run build`, o conecta el
> repositorio de GitHub para despliegues automáticos.

## 6. Uso diario

1. **Agrega tus productos** en la sección "Productos" (código, nombre, precio, existencias).
2. **Genera las etiquetas QR** en "Etiquetas QR", descárgalas o imprime la hoja y
   pégalas en el anaquel o en cada producto.
3. En "Vender", activa la cámara y escanea, o dicta el código por voz, o
   escríbelo — el sistema arma el carrito y calcula el total.
4. Al presionar "Cobrar" se registra la venta y se descuenta el inventario
   automáticamente, con o sin internet.
5. Consulta "Estadísticas" para ver el total de ventas del día, la semana, el
   mes, y qué productos se están agotando.

## Notas y limitaciones importantes

- **Dictado por voz**: usa el reconocimiento de voz del navegador (Chrome),
  que requiere internet. Si no hay conexión, el botón se desactiva
  automáticamente y puedes usar la cámara o escribir el código.
- **Escaneo QR**: funciona completamente sin internet, corre en el propio
  navegador.
- **Sincronización de inventario**: si dos dispositivos venden el mismo
  producto exactamente al mismo tiempo estando ambos sin internet, el
  descuento de existencias se aplica al reconectar en el orden en que ocurrió
  cada venta; en un negocio de una sola caja esto no suele ser un problema.
- **Un solo usuario administrador**: no hay cuentas separadas de cajero; todo
  el que use la app entra con el mismo usuario.
- El primer inicio de sesión sí necesita internet (para validar la contraseña
  una vez); después la sesión queda guardada en el dispositivo y puedes
  entrar sin conexión.
