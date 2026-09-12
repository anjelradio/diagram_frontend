/**
 * Resplandores ambientales de fondo con animación flotante continua y mayor movimiento.
 * Añade profundidad, dinamismo y estética moderna inspirada en Linear/Vercel
 * sin capturar eventos del ratón ni alterar el flujo de contenido.
 */
export function BackgroundGlow() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Resplandor violeta dinámico en el área central-izquierda con movimiento amplio */}
      <div className="absolute left-[15%] top-[20%] h-[500px] w-[500px] sm:h-[600px] sm:w-[600px] rounded-full bg-violet-600/22 blur-[130px] sm:blur-[160px] animate-glow-one will-change-transform" />

      {/* Resplandor azul sutil en la esquina superior-derecha con movimiento orbital */}
      <div className="absolute right-[5%] top-[5%] h-[440px] w-[440px] sm:h-[520px] sm:w-[520px] rounded-full bg-blue-500/18 blur-[140px] sm:blur-[170px] animate-glow-two will-change-transform" />

      {/* Resplandor púrpura profundo en la parte inferior con gran amplitud */}
      <div className="absolute bottom-[-120px] left-[30%] h-[540px] w-[540px] sm:h-[640px] sm:w-[640px] rounded-full bg-purple-700/20 blur-[150px] sm:blur-[180px] animate-glow-three will-change-transform" />

      {/* Halo de luz central detrás del formulario */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] sm:h-[480px] sm:w-[480px] rounded-full bg-indigo-500/10 blur-[130px]" />
    </div>
  );
}

export default BackgroundGlow;
