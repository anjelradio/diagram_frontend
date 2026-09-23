import type { ManualDocument } from "@/features/manual/domain/entities/manual-section.entity";

export const MANUAL_DOCUMENT: ManualDocument = {
  title: "Manual de Usuario y Documentación de Diagram",
  version: "1.0",
  lastUpdated: "2026-09",
  navigation: [
    {
      id: "introduccion",
      label: "Introducción",
      iconName: "BookOpen",
    },
    {
      id: "inicio-rapido",
      label: "Inicio Rápido",
      iconName: "Rocket",
      badge: "Esencial",
    },
    {
      id: "modelado-clases",
      label: "Clases y Relaciones",
      iconName: "Boxes",
    },
    {
      id: "colaboracion",
      label: "Colaboración",
      iconName: "Users",
    },
    {
      id: "asistente-ia",
      label: "Asistente Inteligente",
      iconName: "Bot",
      badge: "Voz e Imagen",
    },
    {
      id: "spring-boot",
      label: "Generación Spring Boot",
      iconName: "Cpu",
    },
    {
      id: "enterprise-architect",
      label: "Enterprise Architect",
      iconName: "FileSpreadsheet",
      badge: "XMI",
    },
  ],
  sections: [
    {
      id: "introduccion",
      title: "1. ¿Qué es Diagram y para qué sirve?",
      subtitle: "Plataforma de modelado arquitectónico visual y colaboración en tiempo real",
      iconName: "BookOpen",
      badge: "Visión General",
      summary:
        "Diagram es un entorno de diseño arquitectónico de software moderno que transforma el modelado conceptual de diagramas de clases UML en artefactos de ingeniería de software directamente aprovechables. Permite a arquitectos, analistas y desarrolladores modelar entidades de dominio, colaborar simultáneamente con su equipo, interactuar con un asistente inteligente multimodal (texto, voz e imágenes) y materializar automáticamente código de backend en Spring Boot o interoperar con Enterprise Architect mediante el estándar XMI.",
      steps: [
        {
          stepNumber: 1,
          title: "Modelado Visual Acelerado",
          description:
            "Diseña entidades de clase, atributos fuertemente tipados, visibilidades, claves primarias y foráneas con atajos ágiles y renderizado fluido en el lienzo interactivo.",
          clickTarget: "Lienzo interactivo / Barra de herramientas lateral derecha",
        },
        {
          stepNumber: 2,
          title: "Sincronización Multiusuario en Tiempo Real",
          description:
            "Invita a compañeros mediante enlaces únicos, visualiza la presencia de colaboradores y realiza modificaciones concurrentes sin conflictos de estado.",
          clickTarget: "Botón 'Compartir' en la esquina superior derecha del proyecto",
        },
        {
          stepNumber: 3,
          title: "Asistencia de Inteligencia Artificial Multimodal",
          description:
            "Genera diagramas dictando instrucciones por voz, enviando bocetos dibujados en papel o mediante comandos conversacionales en lenguaje natural.",
          clickTarget: "Botón flotante del Asistente en la esquina inferior izquierda",
        },
        {
          stepNumber: 4,
          title: "Ingeniería de Software Automatizada",
          description:
            "Exporta en un solo clic un proyecto Spring Boot completo (entidades JPA, repositorios, servicios, DTOs y controladores REST) o archivos XMI listos para Enterprise Architect.",
          clickTarget: "Menú de acciones del proyecto (icono hamburguesa) > Generar Backend / Exportar XMI",
        },
      ],
      features: [
        {
          title: "Diseñado para Arquitectura Limpia",
          description:
            "Estructura alineada a principios de Domain-Driven Design (DDD) y modelado relacional riguroso.",
          iconName: "Layers",
        },
        {
          title: "Disponibilidad Universal",
          description:
            "Acceso público a la documentación y flujo transparente tanto para usuarios registrados como nuevos visitantes.",
          iconName: "Compass",
        },
      ],
      tips: [
        "Puedes acceder a la documentación en cualquier momento desde el login o mediante el botón flotante en la esquina inferior derecha de tus proyectos.",
      ],
    },
    {
      id: "inicio-rapido",
      title: "2. Inicio Rápido: Creando tu Primer Proyecto",
      subtitle: "Flujo paso a paso desde el catálogo hasta el lienzo de trabajo",
      iconName: "Rocket",
      badge: "Primeros Pasos",
      summary:
        "Comenzar un nuevo diseño es inmediato. Desde el catálogo central de proyectos puedes crear espacios en blanco para plasmar libremente tus ideas de modelado o abrir proyectos compartidos por tu organización.",
      steps: [
        {
          stepNumber: 1,
          title: "Acceder al Catálogo de Proyectos",
          description:
            "Inicia sesión con tu correo o crea una cuenta nueva. El sistema te dirigirá automáticamente al catálogo principal en /projects.",
          clickTarget: "Pantalla de Login (/auth/login) > Botón 'Iniciar sesión'",
        },
        {
          stepNumber: 2,
          title: "Hacer clic en 'Nuevo Proyecto'",
          description:
            "En la cabecera del catálogo, haz clic en el botón 'Nuevo proyecto' (identificado con el icono +). Se abrirá un diálogo modal intuitivo.",
          clickTarget: "Botón 'Nuevo proyecto' en el panel superior derecho del catálogo",
          shortcut: "N",
        },
        {
          stepNumber: 3,
          title: "Definir Nombre y Descripción",
          description:
            "Escribe el nombre de tu proyecto (por ejemplo: 'Sistema de Facturación' o 'E-Commerce Core') y agrega una descripción opcional del alcance arquitectónico.",
          clickTarget: "Campos 'Título' y 'Descripción' en el modal de creación",
        },
        {
          stepNumber: 4,
          title: "Ingresar al Lienzo en Blanco",
          description:
            "Presiona 'Crear proyecto'. El sistema creará el espacio de trabajo y abrirá de inmediato el lienzo de dibujo interactivo listo para modelar.",
          clickTarget: "Botón 'Crear' en la esquina inferior del modal",
        },
      ],
      features: [
        {
          title: "Proyectos en Blanco",
          description:
            "Cada nuevo proyecto inicializa un lienzo infinito con controles de zoom, arrastre y centrado.",
          iconName: "FolderPlus",
        },
        {
          title: "Gestión Segura",
          description:
            "Los propietarios pueden renombrar, duplicar, exportar o eliminar sus proyectos con confirmación de seguridad.",
          iconName: "CheckCircle2",
        },
      ],
      tips: [
        "Puedes mantener presionada la barra espaciadora en cualquier momento para activar temporalmente la herramienta Mano y desplazarte por el lienzo.",
      ],
    },
    {
      id: "modelado-clases",
      title: "3. Lienzo y Modelado Visual: Clases, Atributos y Relaciones",
      subtitle: "Construcción detallada de entidades UML y relaciones relacionales",
      iconName: "Boxes",
      badge: "Lienzo UML",
      summary:
        "El núcleo de Diagram es su potente lienzo de modelado UML. Podrás crear clases enriquecidas, gestionar atributos con tipos y visibilidades precisas, y trazar relaciones complejas garantizando la integridad de claves primarias y foráneas.",
      steps: [
        {
          stepNumber: 1,
          title: "Seleccionar la Herramienta 'Crear Clase'",
          description:
            "En la barra de herramientas vertical derecha, haz clic en el botón 'Crear Clase' (icono cuadrado con +). Luego haz clic en cualquier lugar vacío del lienzo.",
          clickTarget: "Barra lateral derecha > Botón 'Crear Clase' (cuadrado con signo +)",
          shortcut: "C",
        },
        {
          stepNumber: 2,
          title: "Configurar Nombre y Estereotipo",
          description:
            "Haz doble clic en el encabezado de la clase para renombrarla (ej. 'Usuario', 'Factura', 'Producto'). Opcionalmente añade un estereotipo como <<entity>>, <<service>> o <<enum>>.",
          clickTarget: "Encabezado superior de la tarjeta de clase en el lienzo",
        },
        {
          stepNumber: 3,
          title: "Gestionar Atributos Fuertemente Tipados",
          description:
            "Usa el botón '+ Atributo' dentro de la clase. Define: nombre del atributo, tipo (String, Long, UUID, Boolean, Double, etc.), visibilidad (+ public, - private, # protected, ~ package), y si actúa como clave primaria (PK) o permite nulos (Nullable).",
          clickTarget: "Botón '+ Atributo' en la parte inferior de la lista de atributos de la clase",
        },
        {
          stepNumber: 4,
          title: "Trazar Relaciones entre Clases",
          description:
            "Selecciona la herramienta 'Relación' (icono de red de nodos) o arrastra directamente desde los puntos de conexión circulares (handles) ubicados en los 4 bordes de cualquier clase hacia los handles de otra clase.",
          clickTarget: "Puntos de conexión (handles) en los bordes de cada clase",
          shortcut: "R",
        },
        {
          stepNumber: 5,
          title: "Tipos de Relaciones y Cardinalidades",
          description:
            "Configura el tipo de relación en el selector: Asociación simple, Agregación (rombo vacío), Composición (rombo relleno), o Generalización / Herencia (flecha hueca triangular). Define cardinalidades en ambos extremos (ej. 1, 0..1, 1..*, 0..*).",
          clickTarget: "Menú contextual de relación o barra de selección de preset de relación",
        },
        {
          stepNumber: 6,
          title: "Relaciones Recursivas (Auto-referenciadas)",
          description:
            "Conecta un handle de una clase con otro handle de la misma clase. Diagram soporta auto-asociaciones recursivas (ej. Empleado supervisa a Empleados, Categoría padre-hijo). El sistema materializa automáticamente una clave foránea nullable (FK) dentro de la misma entidad y la elimina en cascada si se borra la relación.",
          clickTarget: "Arrastre desde un handle lateral a otro handle de la misma clase",
        },
      ],
      features: [
        {
          title: "Claves Foráneas Automáticas",
          description:
            "Al trazar relaciones 1:1 o 1:N, el sistema genera automáticamente el atributo foráneo FK en la entidad correspondiente.",
          iconName: "Database",
        },
        {
          title: "Manejo Inteligente de N:M",
          description:
            "Las relaciones muchos a muchos soportan clases puente intermedias para preservar la integridad relacional.",
          iconName: "Workflow",
        },
      ],
      tips: [
        "Usa el botón 'Selección' (icono de puntero) o la tecla V para mover clases libremente sin activar herramientas de dibujo.",
      ],
    },
    {
      id: "colaboracion",
      title: "4. Colaboración en Tiempo Real y Compartir Proyectos",
      subtitle: "Trabajo concurrente con indicadores de presencia y control de roles",
      iconName: "Users",
      badge: "Multiusuario",
      summary:
        "Diagram integra colaboración en vivo que permite a equipos completos trabajar sobre el mismo modelo arquitectónico simultáneamente, observando cursores en movimiento y cambios inmediatos sin recargar la página.",
      steps: [
        {
          stepNumber: 1,
          title: "Hacer Clic en 'Compartir'",
          description:
            "Dentro de cualquier proyecto en el lienzo, ubica el botón 'Compartir' en el extremo superior derecho del encabezado.",
          clickTarget: "Botón 'Compartir' (icono de personas / compartir) en la barra superior",
        },
        {
          stepNumber: 2,
          title: "Generar Enlace o Código de Invitación",
          description:
            "En el panel de compartir, copia el enlace directo de unión o el código alfanumérico generado por la plataforma.",
          clickTarget: "Botón 'Copiar enlace' o 'Copiar código' dentro del diálogo de compartir",
        },
        {
          stepNumber: 3,
          title: "Unión de Colaboradores (/join)",
          description:
            "El colaborador que recibe el enlace ingresa a la ruta /join/{código}. Tras confirmar su acceso, es incorporado al proyecto al instante.",
          clickTarget: "Pantalla de confirmación de invitación en /join/[code]",
        },
        {
          stepNumber: 4,
          title: "Visualizar Miembros y Roles Activos",
          description:
            "En la parte superior derecha se exhiben los avatares e indicadores de presencia de los colaboradores conectados con sus respectivos roles (Propietario / Editor / Lector).",
          clickTarget: "Lista de avatares de presencia en la barra superior derecha",
        },
      ],
      features: [
        {
          title: "Control Granular de Permisos",
          description:
            "Los propietarios pueden revocar accesos y cambiar roles de colaboradores en cualquier instante.",
          iconName: "Share2",
        },
        {
          title: "Sincronización WebSocket",
          description:
            "Movimientos de clases, creación de relaciones y edición de atributos se difunden en milisegundos a todos los participantes.",
          iconName: "Network",
        },
      ],
      tips: [
        "Los usuarios con rol 'Lector' pueden explorar el diagrama con herramientas de navegación (Mano y Zoom) sin alterar accidentalmente el modelo.",
      ],
    },
    {
      id: "asistente-ia",
      title: "5. Asistente Inteligente Multimodal: Texto, Voz e Imagen",
      subtitle: "Modelado acelerado mediante Inteligencia Artificial generativa",
      iconName: "Bot",
      badge: "IA Avanzada",
      summary:
        "Acelera tu flujo de trabajo mediante el asistente de IA integrado. No requieres dibujar manualmente cada nodo: puedes dictar requerimientos con tu micrófono, subir una foto de un diagrama en pizarra o escribir instrucciones en lenguaje natural.",
      steps: [
        {
          stepNumber: 1,
          title: "Abrir el Asistente de IA",
          description:
            "En el lienzo de trabajo, haz clic en el botón flotante del Asistente (icono de robot o destellos) ubicado en la esquina inferior izquierda.",
          clickTarget: "Botón esférico del Asistente en la esquina inferior izquierda",
        },
        {
          stepNumber: 2,
          title: "Comandos por Texto",
          description:
            "Escribe en el campo de chat peticiones directas como: 'Crea una clase Pedido con atributos id, total y fecha, y asóciala con la clase Cliente'. El asistente creará y conectará las clases en tu lienzo.",
          clickTarget: "Campo de entrada de texto en el panel lateral del Asistente",
        },
        {
          stepNumber: 3,
          title: "Comandos por Voz con Micrófono",
          description:
            "Presiona el botón del micrófono para grabar tu voz. Di en voz alta lo que deseas construir (ej: 'Agrega una relación de herencia entre Vehículo y Automóvil'). Suelta el botón para transcribir y aplicar el comando automáticamente.",
          clickTarget: "Botón de micrófono (icono Mic) junto a la barra de entrada del chat",
        },
        {
          stepNumber: 4,
          title: "Carga y Análisis de Imágenes",
          description:
            "Haz clic en el botón de imagen para adjuntar una fotografía de una pizarra física, un boceto a lápiz o una captura de pantalla. El modelo de visión de Gemini analizará las cajas, textos y flechas para reconstruir el diagrama completo en el canvas.",
          clickTarget: "Botón de carga de imagen (icono Image) en la barra de entrada del asistente",
        },
      ],
      features: [
        {
          title: "Retroalimentación en Tiempo Real",
          description:
            "El asistente muestra actividades visuales de progreso indicando qué operaciones está ejecutando en el diagrama.",
          iconName: "Sparkles",
        },
        {
          title: "Multimodalidad Completa",
          description:
            "Combina texto explicativo con notas de voz o diagramas de referencia en una misma sesión.",
          iconName: "Mic",
        },
      ],
      tips: [
        "Si necesitas que el asistente organice el diseño, pídele: 'Distribuye las clases para que no se superpongan'.",
      ],
    },
    {
      id: "spring-boot",
      title: "6. Generación de Código Backend en Spring Boot",
      subtitle: "Exporta una aplicación backend completa y lista para producción",
      iconName: "Cpu",
      badge: "Código Listo",
      summary:
        "Transforma tu arquitectura visual en un proyecto de software funcional. El generador de Spring Boot traduce tus clases UML en entidades JPA, interfaces de repositorio Spring Data, servicios, controladores REST con DTOs y configuración de base de datos.",
      steps: [
        {
          stepNumber: 1,
          title: "Abrir el Menú de Opciones del Proyecto",
          description:
            "En la esquina superior izquierda del lienzo, haz clic en el botón de menú hamburguesa (icono de 3 líneas horizontales).",
          clickTarget: "Botón de menú hamburguesa en la barra superior izquierda del lienzo",
        },
        {
          stepNumber: 2,
          title: "Seleccionar 'Generar Backend Spring Boot'",
          description:
            "En la lista de acciones desplegada, selecciona la opción 'Generar Backend Spring Boot'.",
          clickTarget: "Elemento 'Generar Backend Spring Boot' en el menú desplegable",
        },
        {
          stepNumber: 3,
          title: "Descargar el Archivo ZIP",
          description:
            "El backend procesa en milisegundos todo el modelo, empaqueta la estructura de carpetas estándar de Spring Boot (Maven/Gradle) y descarga automáticamente un archivo ZIP a tu equipo.",
          clickTarget: "Descarga directa automática en tu navegador web",
        },
        {
          stepNumber: 4,
          title: "Estructura del Proyecto Generado",
          description:
            "El ZIP descargado incluye: Modelos JPA (@Entity, @Id, @Column, @ManyToOne, @OneToMany), Repositorios JpaRepository, Servicios (@Service con CRUD completo), Controladores REST (@RestController) y application.properties.",
          clickTarget: "Descomprimir y abrir en tu IDE favorito (IntelliJ, VS Code, Eclipse)",
        },
      ],
      features: [
        {
          title: "Mapeo Relacional Fiel",
          description:
            "Las relaciones UML se convierten con precisión en anotaciones JPA con claves foráneas e integridad referencial.",
          iconName: "Code2",
        },
        {
          title: "Descarga Inmediata",
          description:
            "Sin dependencias externas ni configuraciones complejas: listo para ejecutar con ./mvnw spring-boot:run.",
          iconName: "Download",
        },
      ],
      tips: [
        "Asegúrate de marcar al menos un atributo como clave primaria (PK) en cada clase para una generación óptima de entidades JPA.",
      ],
    },
    {
      id: "enterprise-architect",
      title: "7. Interoperabilidad con Enterprise Architect (XMI)",
      subtitle: "Importa y exporta modelos estándar entre Diagram y herramientas CASE",
      iconName: "FileSpreadsheet",
      badge: "Estándar XMI",
      summary:
        "Diagram no es un silo cerrado. Soporta el intercambio de esquemas arquitectónicos mediante el estándar XML/XMI utilizado por Enterprise Architect y otras herramientas CASE líderes de la industria.",
      steps: [
        {
          stepNumber: 1,
          title: "Importar un Proyecto desde Enterprise Architect",
          description:
            "En el catálogo principal de proyectos (/projects), haz clic en el botón 'Importar XMI'. Selecciona tu archivo .xml o .xmi generado en Enterprise Architect.",
          clickTarget: "Botón 'Importar XMI' en el catálogo de proyectos (/projects)",
        },
        {
          stepNumber: 2,
          title: "Reconstrucción Automática del Diagrama",
          description:
            "La plataforma analiza el archivo XMI, parsea las clases, atributos, visibilidades y relaciones, y recrea el proyecto completo en tu espacio de trabajo.",
          clickTarget: "Apertura automática del proyecto importado",
        },
        {
          stepNumber: 3,
          title: "Exportar a Enterprise Architect (XMI)",
          description:
            "Para llevar tu diagrama a Enterprise Architect, abre el menú del proyecto (icono hamburguesa) dentro del lienzo y selecciona 'Exportar XMI'.",
          clickTarget: "Menú del proyecto > 'Exportar XMI' (descarga archivo .xmi)",
        },
        {
          stepNumber: 4,
          title: "Abrir en Enterprise Architect",
          description:
            "Abre tu software Enterprise Architect, selecciona Import > Package from XMI y carga el archivo descargado para continuar tu análisis corporativo.",
          clickTarget: "Menú contextual de Enterprise Architect en tu sistema local",
        },
      ],
      features: [
        {
          title: "Compatibilidad Bidireccional",
          description:
            "Flujo sin pérdidas: exporta desde Diagram hacia EA o importa modelos heredados hacia Diagram.",
          iconName: "UploadCloud",
        },
        {
          title: "Cumplimiento del Estándar",
          description:
            "Preserva nombres, paquetes, estereotipos y conectores relacionales de acuerdo a especificaciones OMG XMI.",
          iconName: "CheckCircle2",
        },
      ],
      tips: [
        "Puedes usar la exportación XMI como copia de seguridad versionada de la arquitectura de tu sistema.",
      ],
    },
  ],
};
