
# Aplicación Web Colaborativa para el Modelado de Datos

### Frontend — Next.js + TypeScript

Aplicación web desarrollada para el **Segundo Examen Parcial de Ingeniería de Software I**, correspondiente a la gestión **II/2026** de la Universidad Autónoma Gabriel René Moreno (UAGRM).

El proyecto consiste en una plataforma colaborativa para el diseño, administración y modelado de diagramas de clases UML, permitiendo a múltiples usuarios trabajar sobre proyectos compartidos mediante una interfaz visual e intuitiva.

La aplicación incorpora herramientas de modelado, colaboración en tiempo real y un asistente inteligente que facilita la creación, modificación, consulta y análisis de diagramas mediante instrucciones en lenguaje natural.

---

## Tecnologías utilizadas

| Tecnología | Descripción |
|------------|-------------|
| **Next.js** | Framework para el desarrollo de la aplicación web. |
| **React** | Biblioteca para la construcción de interfaces de usuario. |
| **TypeScript** | Lenguaje utilizado para implementar componentes con tipado estático. |
| **HTML5** | Estructuración de la interfaz web. |
| **CSS3** | Estilos y presentación visual de la aplicación. |
| **REST API** | Comunicación con los servicios del backend. |
| **FastAPI** | Backend desarrollado en Python con el que se integra la aplicación. |

---

## Funcionalidades principales

### 1. Gestión de proyectos

La plataforma permite organizar y administrar proyectos destinados al modelado de datos.

- Crear nuevos proyectos.
- Actualizar información de proyectos existentes.
- Eliminar proyectos.
- Acceder a proyectos propios y compartidos.
- Administrar colaboradores y permisos.

### 2. Editor visual de diagramas UML

Interfaz gráfica interactiva para la construcción y edición de diagramas de clases UML.

- Crear, modificar, mover y eliminar clases.
- Agregar y administrar atributos.
- Establecer relaciones entre clases.
- Organizar visualmente los elementos del diagrama.
- Visualizar los cambios realizados sobre el modelo.

### 3. Colaboración entre usuarios

El sistema permite que distintos integrantes participen en el desarrollo de un mismo proyecto.

- Compartir proyectos mediante invitaciones.
- Incorporar colaboradores.
- Administrar permisos de lectura y edición.
- Trabajar colaborativamente sobre diagramas.
- Visualizar modificaciones realizadas por otros participantes.

### 4. Asistente inteligente

La aplicación integra una interfaz de conversación con un asistente de inteligencia artificial que permite interactuar con los diagramas mediante lenguaje natural.

El asistente admite distintas categorías de interacción:

- **Creación y modificación:** permite solicitar cambios en clases, atributos y relaciones.
- **Consultas conceptuales:** proporciona orientación sobre modelado UML.
- **Inspección del diagrama:** permite consultar los elementos existentes.
- **Consultas de auditoría:** permite conocer el historial de modificaciones del proyecto.

Ejemplos de consultas:

```text
Crea una clase llamada Producto.

Agrega el atributo precio a la clase Producto.

¿Qué atributos tiene la clase Producto?

¿Qué relaciones debería tener la clase Pedido?

¿Quién creó la clase Producto?

¿Qué modificaciones realizó un colaborador ayer?
```

### 5. Historial y auditoría

El sistema permite consultar las modificaciones realizadas sobre los diagramas.

- Identificar quién realizó determinada modificación.
- Consultar operaciones de creación, actualización y eliminación.
- Visualizar cambios sobre clases, atributos y relaciones.
- Consultar actividades por colaborador.
- Filtrar eventos por fechas.
- Presentar los horarios según la zona horaria configurada.

### 6. Generación e interoperabilidad

La plataforma contempla herramientas para facilitar la transición del modelo UML hacia otros entornos de desarrollo.

- Generación de proyectos backend con Spring Boot.
- Importación de modelos mediante archivos XMI.
- Exportación de diagramas en formato XMI.
- Integración con servicios externos según la configuración del proyecto.

---

## Arquitectura general

El frontend está desarrollado con Next.js y TypeScript, y se comunica con un backend implementado en Python y FastAPI.

```text
┌───────────────────────────────┐
│          USUARIO              │
│       Navegador web           │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│           FRONTEND            │
│      Next.js + TypeScript     │
│                               │
│  • Interfaz de proyectos      │
│  • Editor de diagramas UML    │
│  • Gestión de colaboradores   │
│  • Asistente inteligente      │
│  • Visualización de auditoría │
└───────────────┬───────────────┘
                │
                │ API REST / HTTPS
                ▼
┌───────────────────────────────┐
│           BACKEND             │
│       Python + FastAPI        │
│                               │
│  • Lógica de negocio          │
│  • Gestión de proyectos       │
│  • Procesamiento de diagramas │
│  • Servicios de IA            │
│  • Auditoría y persistencia   │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│       BASE DE DATOS           │
│   Almacenamiento persistente  │
└───────────────────────────────┘
```

La separación entre frontend y backend permite mantener responsabilidades independientes y facilita la evolución de los componentes del sistema.

---

## Requisitos previos

Antes de ejecutar el proyecto, es necesario contar con:

- **Node.js**, en una versión compatible con el proyecto.
- **npm**, o el gestor de paquetes utilizado por el repositorio.
- **Git**, para clonar el código fuente.
- Un editor de código, preferentemente Visual Studio Code.
- Acceso al backend FastAPI para utilizar las funcionalidades que requieren comunicación con el servidor.

Puedes verificar las versiones instaladas mediante:

```bash
node --version
npm --version
git --version
```

---

## Instalación y ejecución

### 1. Clonar el repositorio

Abre una terminal y ejecuta:

```bash
git clone https://github.com/USUARIO/REPOSITORIO-FRONTEND.git
```

Reemplaza la dirección con la URL real del repositorio.

### 2. Acceder al proyecto

```bash
cd REPOSITORIO-FRONTEND
```

### 3. Instalar las dependencias

Ejecuta:

```bash
npm install
```

Este comando instalará las dependencias definidas en `package.json`.

Si el repositorio utiliza otro gestor de paquetes, emplea el comando correspondiente.

### 4. Configurar las variables de entorno

Si el proyecto utiliza variables de entorno, crea un archivo:

```text
.env.local
```

Por ejemplo, si el frontend utiliza una variable pública para la dirección del backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Importante:** el nombre de esta variable es ilustrativo. Debe coincidir con el utilizado realmente en el código del proyecto.

No incluyas claves privadas, tokens secretos ni credenciales del servidor en variables que comiencen con `NEXT_PUBLIC_`.

### 5. Iniciar el servidor de desarrollo

Ejecuta:

```bash
npm run dev
```

Una vez iniciado, abre el navegador en:

```text
http://localhost:3000
```

El puerto puede variar según la configuración del proyecto.

### 6. Conectar con el backend

Para utilizar correctamente las funcionalidades de gestión de proyectos, diagramas, colaboración y asistente inteligente, es necesario contar con el backend disponible.

El backend está desarrollado en Python utilizando FastAPI y debe configurarse siguiendo las instrucciones de su propio repositorio.

También debe configurarse CORS en el backend para permitir las solicitudes provenientes del frontend.

---

## Comandos disponibles

Los siguientes comandos corresponden a los scripts habituales de Next.js, siempre que estén definidos en el archivo `package.json`.

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run build` | Genera una compilación de producción. |
| `npm run start` | Ejecuta la aplicación compilada. |
| `npm run lint` | Ejecuta la revisión de código, si está configurada. |

### Compilación de producción

```bash
npm run build
```

Para ejecutar la versión compilada:

```bash
npm run start
```

---

## Metodología de desarrollo

El proyecto toma como referencia el **Proceso Unificado de Desarrollo de Software (PUDS)**, caracterizado por un enfoque iterativo e incremental, orientado a casos de uso y centrado en la arquitectura.

El proceso contempla los siguientes flujos de trabajo:

1. **Captura de requisitos:** identificación de actores, casos de uso y funcionalidades.
2. **Análisis:** definición de componentes conceptuales y comportamiento del sistema.
3. **Diseño:** elaboración de modelos estructurales, diagramas y arquitectura.
4. **Implementación:** construcción e integración de los componentes de software.
5. **Pruebas:** verificación del funcionamiento y cumplimiento de los requisitos.

El frontend representa la capa de interacción del usuario con los servicios implementados en el backend.

---

## Objetivo del proyecto

### Objetivo general

Desarrollar una aplicación web colaborativa que facilite el diseño, administración y modificación de modelos de datos mediante diagramas de clases UML, integrando herramientas visuales y asistencia inteligente.

### Objetivos específicos

- Implementar una interfaz accesible para la gestión de proyectos.
- Facilitar la construcción visual de diagramas UML.
- Permitir el trabajo colaborativo entre usuarios.
- Integrar herramientas de asistencia mediante inteligencia artificial.
- Facilitar la consulta del historial de modificaciones.
- Mantener una comunicación organizada entre el frontend y los servicios del backend.

---

## Integrantes del proyecto

**Universidad:** Universidad Autónoma Gabriel René Moreno (UAGRM)  
**Facultad:** Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones  
**Materia:** Ingeniería de Software I  
**Evaluación:** Segundo Examen Parcial  
**Gestión:** II/2026  
**Lugar:** Santa Cruz de la Sierra, Bolivia

| N.º | Nombre completo | Responsabilidad |
|-----|-----------------|-----------------|
| 1 | Aradivi Mamani Luciana Paulina | Desarrollo |
| 2 | Santos Castro Roberto Anjel | Desarrollo |



---

## Documentación

La documentación académica del proyecto comprende:

- Captura y especificación de requisitos.
- Modelos de casos de uso.
- Diagramas de análisis y diseño UML.
- Diseño arquitectónico.
- Diagramas de secuencia.
- Diagramas de componentes.
- Pruebas de funcionamiento.
- Manual de usuario.

Estos artefactos forman parte del desarrollo correspondiente al Segundo Examen Parcial de Ingeniería de Software I.

---

## Consideraciones

Este repositorio corresponde exclusivamente al **frontend** de la aplicación.

Las funcionalidades que dependen de persistencia, autenticación, colaboración, procesamiento de diagramas o inteligencia artificial requieren la disponibilidad y configuración de los servicios del backend FastAPI.

El proyecto fue desarrollado con fines académicos como parte de la asignatura Ingeniería de Software I.

---

**UAGRM — Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones**  
**Ingeniería de Software I | Segundo Examen Parcial | Gestión II/2026**
