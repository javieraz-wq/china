# China 2026

Aplicación web privada para el viaje de octubre de 2026. Estática, sin backend y
preparada para GitHub Pages.

## Desplegar

1. Sube el contenido de esta carpeta a la raíz del repositorio.
2. Settings → Pages → Source: `Deploy from a branch`, rama `main`, carpeta `/ (root)`.
3. Listo. No hay que tocar ninguna ruta: todo es relativo, así que funciona igual en
   `usuario.github.io/repo/` que en un dominio propio.

Para probarlo en local basta con abrir `index.html`. No usa `fetch`, así que también
funciona desde `file://`.

## Cómo está montado

```
index.html          estructura y pantalla de acceso
styles.css          todos los estilos
app.js              navegación, vistas y acordeones
art.js              ilustraciones SVG generadas en el navegador
sha256.js           hash de la contraseña
sw.js               caché offline
data/               los datos del viaje, ya filtrados
assets/             iconos de la app y carpeta para fotos
```

**Cero dependencias externas.** Ni CDN, ni fuentes de Google, ni imágenes remotas.
Todo se sirve desde el propio repositorio, que es lo que hace que funcione en China
sin VPN. Si añades algo, mantén esa regla.

Las tipografías son las del sistema: en iPhone salen New York para los titulares y
SF Pro para el texto, que es exactamente lo que buscábamos y no cuesta ni un byte.

## Los datos

Están en `data/*.js`, un archivo por bloque. Son JSON dentro de una asignación a
`window.TRIP`, para que funcionen sin servidor. Si prefieres JSON puro, quitar la
primera línea de cada archivo y cambiar a `fetch` es un cambio de diez minutos.

Para editar cualquier cosa del viaje solo hay que tocar esos archivos: la interfaz
se reconstruye sola. Después de cambiarlos, sube el número de `VERSION` en `sw.js`
o el navegador seguirá sirviendo la copia antigua.

**Estos archivos ya están filtrados.** No contienen precios, importes, localizadores,
códigos de reserva, teléfonos, nombres de personas ni quién pagó o propuso nada. La
hoja `Info general` del Excel no se ha usado en absoluto. Si vuelves a exportar datos
del Excel, mantén ese filtro: la web es pública aunque tenga contraseña.

## Fotos de los hoteles

Cada hotel y cada destino se ilustran con una escena SVG generada al vuelo. Son
dibujos propios, no fotos genéricas de stock de otro hotel.

Si quieres poner fotos reales:

1. Guarda la imagen en `assets/photos/` (JPG, unos 1200 px de ancho, bien comprimida).
2. En `data/hotels.js`, rellena el campo `photo` de ese hotel:
   `"photo": "assets/photos/shanghai.jpg"`.

La foto sustituye a la ilustración solo si carga correctamente. Si falla o no existe,
se queda el dibujo, así que no hay huecos rotos.

## La contraseña

`2026china`. Guardada como hash SHA-256 en `app.js`, no en claro.

Esto **no es seguridad real** y no pretende serlo: cualquiera que abra el código
fuente puede leer los datos. Es una barrera para que el enlace no quede abierto a
cualquiera que lo encuentre. Por eso los datos del repositorio están filtrados: la
protección de verdad es que la información sensible no está aquí.

La sesión se guarda en `sessionStorage`, así que se cierra al cerrar la pestaña.
Hay un botón de cerrar sesión al final de «Más info».

## Offline

`sw.js` cachea la app entera en la primera visita. Después funciona sin conexión,
que en China viene bien más veces de las que parece. El único estado que se guarda
es qué tareas de la checklist están marcadas (en `localStorage`).

## Decisiones que conviene conocer

- **Los días de Pekín del Excel.** Las filas marcadas «Pekín VALENCIANOS» no son una
  versión más nueva del plan, son el plan de otro subgrupo: cambian los días 23, 24 y
  25 y vuelan a casa el 25 vía Estambul. No se han fusionado. Los días 23, 24 y 25
  tienen un selector para ver cada versión, con el plan general por defecto.
- **El aviso sobre Pingyao** que había en la hoja de avisos se ha dejado fuera:
  Pingyao no está en este itinerario.
- **El traslado del 12 de octubre** (Zhangjiajie Oeste → Wulingyuan) no aparece en
  Transportes: en el Excel la hora estaba sin formato y no hacía falta como trayecto
  con horario. Sigue estando en el itinerario de esa noche, sin hora inventada.
- Los enlaces de Trip.com se han limpiado de parámetros de seguimiento y de cualquier
  dato de la reserva.
