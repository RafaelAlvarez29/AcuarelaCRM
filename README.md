# 🎨 Acuarela - papelería social CRM

<p align="center">
  <img src="public/icon/ACUARELA%20LOGO3.svg" alt="Logo de Acuarela Design Studio" width="200"/>
</p>

Herramienta interna de gestión de clientes (CRM), proyectos, pagos, catálogo de productos y cotizaciones, diseñada a medida para **Acuarela Design Studio**.

---

## 💡 ¿Por qué este CRM?

Es una **solución interna y ligera** para un solo usuario (la dueña de la empresa), que prioriza la simplicidad y no requiere servidor.

| Característica | Detalle |
| :--- | :--- |
| **Stack** | React 19 + TypeScript, Vite, Tailwind CSS 4 con componentes shadcn/ui (Radix), Zustand para el estado y `@react-pdf/renderer` para los PDF. |
| **Almacenamiento** | Los datos se guardan en **IndexedDB** del navegador del equipo de la dueña. Si existían datos de versiones anteriores en `localStorage`, se migran automáticamente la primera vez que se abre la app. |
| **Sin backend** | La información nunca sale del navegador. Por eso mismo, **si se borran los datos de navegación o se cambia de equipo, se pierde**: hay que exportar respaldos periódicamente (la app lo recuerda tras 7 días sin respaldo). |

---

## 🚀 Funcionalidades

### 1. 📊 Dashboard y tablero
* Ingreso total, saldo pendiente por cobrar y gráficas de ingresos por mes/semana y por cliente/proyecto.
* Listas de **pagos pendientes** y **próximas entregas** (incluye las de hoy).
* Tablero tipo kanban por estado del proyecto.

### 2. 👥 Clientes y comunicación
* Ficha de cliente con foto, métricas financieras y proyectos activos/completados.
* **WhatsApp integrado:** mensajes generados según el estado del proyecto, con plantillas editables en Ajustes (`[NOMBRE_CLIENTE]`, `[NOMBRE_PROYECTO]`, `[SALDO_PENDIENTE]`).

### 3. 💼 Proyectos y pagos
* Alta, edición y eliminación de proyectos; cambio de estado desde un menú.
* Registro de abonos con cálculo del saldo en tiempo real. No se permite abonar más que el saldo pendiente.
* Opción para marcar un proyecto como pagado manualmente.

### 4. 🧾 Productos y cotizaciones
* Catálogo de productos con precio base y precio por tipo de evento.
* Cotizaciones con descuento (porcentaje o fijo, limitado al subtotal), impuesto y anticipo; exportación a PDF y envío por WhatsApp.
* **Convertir en proyecto:** crea un proyecto para el cliente de la cotización y la marca como *Aprobada*. Cada cotización genera un solo proyecto; si ya existe, el botón lleva a él.

### 5. 💾 Respaldo (importar/exportar)
* **Exportar:** descarga un JSON `DataAcuarelaCRM_[YYYYMMDD].json` con clientes, proyectos, pagos, productos, tipos de evento, cotizaciones y ajustes.
* **Importar:** arrastrar y soltar un JSON. Cada registro se valida (zod); los que tienen datos incompletos o inválidos se descartan y se avisa cuántos fueron. Las colecciones ausentes en respaldos antiguos se tratan como vacías.
  * **Reemplazar todo:** sustituye todos los datos actuales.
  * **Añadir a existentes:** agrega los registros nuevos y **omite** los clientes y proyectos cuyo nombre ya existe (no pregunta qué versión conservar). Si el archivo trae formato de cotización, se aplican los campos que tengan texto.

### 6. 🔒 Datos del negocio
La dirección, el teléfono y los datos bancarios que aparecen en las cotizaciones **no están en el código**. Se capturan en **Ajustes → Formato de cotización** o se cargan importando un JSON con solo esa sección (en **Datos → Importar → Añadir a existentes**):

```json
{ "clients": [], "projects": [], "settings": { "quoteFormat": { "address": "…", "phone": "…", "footerText": "…" } } }
```

La carpeta `respaldos/` está en `.gitignore` para guardar ahí ese archivo sin subirlo al repositorio.

---

## 🛠️ Desarrollo

Requisitos: [Node.js](https://nodejs.org) 20 o superior.

```bash
git clone https://github.com/RafaelAlvarez29/AcuarelaCRM.git
cd AcuarelaCRM
npm install
npm run dev
```

En Windows también puedes usar:

* `correr.bat` — instala dependencias si faltan y levanta el servidor de desarrollo en `http://acuarela.localhost:5173/`.
* `produccion.bat` — compila (`npm run build`) y sirve la build en `http://acuarela.localhost:4173/`. Con `--skip-build` sirve la última build.

Otros scripts:

| Comando | Qué hace |
| :--- | :--- |
| `npm run build` | Verifica tipos (`tsc -b`) y genera `dist/`. |
| `npm run lint` | Ejecuta oxlint. |
| `npm run preview` | Sirve `dist/` localmente. |

> Ya no es posible abrir `index.html` directamente con `file:///`: la app debe compilarse con Vite.

## 🌐 Despliegue

Sube el contenido de `dist/` a cualquier hosting estático (por ejemplo Netlify). La app usa `HashRouter`, así que no necesita reglas de redirección. Los datos siguen viviendo en el navegador de quien la use.

---
**© Acuarela Design Studio.**
