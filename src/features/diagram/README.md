# Flujo de diagramas

El feature mantiene sus responsabilidades dentro de `src/features/diagram/`:

- `domain/` contiene entidades, reglas y políticas puras de clases, atributos y relaciones.
- `application/` coordina comandos y sus puertos de proyección, identificadores, tiempo y persistencia local.
- `infrastructure/` implementa los repositorios HTTP, mappers y la cola durable de IndexedDB.
- `presentation/` contiene el lienzo, componentes, hooks de sincronización y el slice Zustand.

## Recorrido frontend first

```text
componente/slice -> caso de uso de comando -> enqueue IndexedDB -> proyección Zustand
                 -> señal diagram:process-queue -> sincronizador -> ejecutor HTTP
                 -> repositorio HTTP -> caso de uso backend -> Unit of Work -> realtime
```

La operación queda durable antes de modificar la proyección. El servidor recalcula las reglas y valida el agregado recibido. Los componentes expresan interacción y delegan los comandos; el store conserva estado visual, proyección local y aplicación de cambios remotos.

Los IDs de clase y PK, atributo, relación, FK y clase puente se generan una sola vez en el cliente y se conservan durante los reintentos.

## Contratos del recorrido

- `application/ports/` declara la proyección, runtime (ID/reloj/señal) y despacho durable.
- `dispatch-diagram-operation` asigna metadatos de operación y aplica estrictamente `enqueue -> project -> signal`; un error al guardar no cambia Zustand.
- `execute-diagram-operation` contiene el switch exhaustivo de los 11 kinds canónicos y delega las mutaciones a repositorios.
- La cola es el único adaptador que acepta los kinds históricos `CREATE`, `RENAME`, `MOVE` y `DELETE`; normaliza al formato `*_CLASS` al insertar y al migrar registros persistidos.
- Canvas, nodos y filas de atributos no importan IndexedDB ni repositorios HTTP. La cola permanece detrás de la acción de aplicación del slice; la sincronización y la rehidratación conservan sus adaptadores actuales.

