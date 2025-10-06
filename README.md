# 🎨 Acuarela - papeleria social CRM

<p align="center">
  <img src="https://github.com/RafaelAlvarez29/AcuarelaCRM/tree/main/icon/ACUARELA%20LOGO3.svg" alt="Logo de Acuarela Design Studio" width="200"/>
</p>

Herramienta interna de gestión de clientes (CRM), proyectos y pagos diseñada a medida para **Acuarela Design Studio**. Su objetivo es simplificar la administración de trabajos activos, monitorear saldos pendientes y optimizar la comunicación.

---

## 💡 ¿Por Qué Este CRM?

Este proyecto fue desarrollado como una **solución interna y ultraligera** para un solo usuario (la dueña de la empresa), priorizando la **simplicidad y la portabilidad de los datos**.

| Característica | Detalle |
| :--- | :--- |
| **Arquitectura** | Desarrollado con **HTML, JavaScript puro y Tailwind CSS**. Es rápido y no requiere backend. |
| **Almacenamiento Local** | Todos los datos (clientes, proyectos, pagos) se guardan directamente en el **navegador (LocalStorage)** del equipo de la dueña. |
| **Seguridad y Hosting** | Alojado en **Netlify** para un acceso sencillo. La información nunca sale del navegador, garantizando un control total. |
| **Enfoque de Negocio** | Optimizado para estudios de diseño gráfico, con foco en el control de pagos parciales y el ciclo de vida del proyecto. |

---

## 🚀 Funcionalidades Clave

### 1. 📊 Dashboard y Flujo de Trabajo
* **Monitoreo Financiero:** Vista rápida del ingreso total y del saldo pendiente general por cobrar.
* **Alertas Clave:** Secciones cliqueables que destacan rápidamente los **Trabajos con Pagos Pendientes** y las **Próximas Fechas de Entrega**.
* **Barra de Pago:** Indicador visual en cada tarjeta de proyecto que muestra el progreso del pago (rojo si hay saldo, verde si está saldado).

### 2. 👥 Gestión de Clientes y Comunicación
* **Historial Completo:** Almacena información esencial, incluyendo una foto de perfil y métricas financieras individuales.
* **WhatsApp Integrado:** Botones de acción directa que generan automáticamente mensajes basados en el estado actual del proyecto (`En Proceso`, `Pendiente de Pago`, etc.).
* **Manejo de Proyectos:** Acceso instantáneo al listado de proyectos activos y completados por cliente.

### 3. 💼 Administración de Proyectos y Pagos
* **CRUD Completo:** Permite crear, actualizar y eliminar clientes, proyectos y pagos.
* **Registro de Abonos:** Registra abonos y calcula el saldo restante del proyecto en tiempo real.
* **Estados de Proyecto:** Permite cambiar el estado del trabajo fácilmente a través de un menú desplegable.

### 4. 💾 Importación y Exportación de Datos (Backup)

Funcionalidad crítica para garantizar la seguridad de la información alojada en el navegador.

* **Exportación Simple:** Descarga una copia de seguridad completa (`clientes`, `proyectos`, `pagos`, `ajustes`) en un archivo **JSON** con el nombre `DataAcuarelaCRM_[YYYYMMDD].json`.
* **Importación con Arrastrar y Soltar:** Interfaz intuitiva para cargar archivos JSON.
* **Resolución de Conflictos:** Al importar, el sistema pregunta cómo manejar los datos:
    * **Reemplazar:** Sobrescribe todos los datos actuales por los importados (requiere doble confirmación).
    * **Añadir/Fusionar:** Añade nuevos registros y, si encuentra clientes o proyectos duplicados por nombre, pregunta qué versión mantener (la actual o la importada).

---

## 🛠️ Instalación y Uso

Dado que no se requiere base de datos, la configuración es trivial:

1.  **Clonar el Repositorio:**
    ```bash
    git clone [https://github.com/TuUsuario/TuRepositorio.git](https://github.com/TuUsuario/TuRepositorio.git)
    cd acuarela-crm
    ```
2.  **Uso Local:**
    Abre el archivo `index.html` directamente en tu navegador (`file:///.../index.html`).
3.  **Despliegue (Recomendado):**
    Sube los archivos a **Netlify** (o cualquier hosting estático) para usar la aplicación de forma persistente. Tus datos se mantendrán en el navegador de tu computadora.

---
**© 2024 Acuarela Design Studio.** Desarrollado por [Tu Nombre o Usuario de GitHub].
