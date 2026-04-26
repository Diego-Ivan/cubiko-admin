# Documentación de la API

## Autenticación

### JWT

La API utiliza tokens de JWT para realizar autenticación. Cuando se hace una request de login o de registro de usuario, se obtiene una respuesta como la siguiente:

```json
{
  "success": true,
  "data": {
    "access_token": "d6f7a871637550836749bfa0432db7b21e76b16e084182ec898486cede571eb3",
    "expires_in": "24h"
  },
  "message": "Login successful"
}
```

El token `access_token` podrá ser utilizado por los usuarios de la API para realizar operaciones autenticadas dependiendo del rol de cada uno de ellos. El token se envía como cabecera para las operaciones que requieran autenticación.

### Registro de Estudiantes

- **Endpoint**: `/api/auth/register`
- **Tipo de Request**: `POST`
- **Parámetros**: Ninguno
- **Cuerpo de la Request**: Documento `JSON`:
  - `nombre`: `string`
  - `email`: `string`
  - `password`: `string`
  - `status`?: `"Activo" | "Inactivo" | "Egresado"` (default: `"Activo"`)
- **Respuesta**: Documento `JSON`:
  - `201`: La solicitud se completó satisfactoriamente:
    - `success`: Si la operación tuvo éxito.
    - `data`: Diccionario:
      - `access_token`: Token de acceso JWT.
      - `expires_in`: Tiempo de expiración del token. Por el momento, es 24 horas.
    - `message`: Mensaje con información adicional
  - `409`: Email ya en uso

### Login de Estudiantes

- **Endpoint**: `/api/auth/login`
- **Tipo de Request**: `POST`
- **Parámetros**: Ninguno
- **Cuerpo de la Request**: Documento `JSON`:
  - `email`: `string`
  - `password`: `string`
- **Respuesta**: Documento `JSON`:
  - `201`: La solicitud se completó satisfactoriamente:
    - `success`: Si la operación tuvo éxito.
    - `data`: Diccionario:
      - `access_token`: Token de acceso JWT.
      - `expires_in`: Tiempo de expiración del token. Por el momento, es 24 horas.
    - `message`: Mensaje con información adicional
  - `401`: Operación no autorizada. Vea el mensaje del error.

  ### Registro de Personal

- **Endpoint**: `/api/auth/register-personnel`
- **Tipo de Request**: `POST`
- **Parámetros**: Ninguno
- **Cuerpo de la Request**: Documento `JSON`:
  - `nombre`: `string`
  - `email`: `string`
  - `password`: `string`
  - `rol`?: `"Bibliotecario" | "Admin"`
- **Respuesta**: Documento `JSON`:
  - `201`: La solicitud se completó satisfactoriamente:
    - `success`: Si la operación tuvo éxito.
    - `data`: Diccionario:
      - `access_token`: Token de acceso JWT.
      - `expires_in`: Tiempo de expiración del token. Por el momento, es 24 horas.
    - `message`: Mensaje con información adicional
  - `409`: Email ya en uso

### Login de Personal

- **Endpoint**: `/api/auth/login-personnel`
- **Tipo de Request**: `POST`
- **Parámetros**: Ninguno
- **Cuerpo de la Request**: Documento `JSON`:
  - `email`: `string`
  - `password`: `string`
- **Respuesta**: Documento `JSON`:
  - `201`: La solicitud se completó satisfactoriamente:
    - `success`: Si la operación tuvo éxito.
    - `data`: Diccionario:
      - `access_token`: Token de acceso JWT.
      - `expires_in`: Tiempo de expiración del token. Por el momento, es 24 horas.
    - `message`: Mensaje con información adicional
  - `401`: Operación no autorizada. Vea el mensaje del error.

## Salas

### Enlistar todas las salas

- **Endpoint**: `/api/rooms`
- **Tipo de Request**: `GET`
- **Parámetros**: Ninguno
- **Cuerpo de la Request**: Ninguno
- **Cabeceras**:
  - `Authorization`: `Bearer: {token_jwt}`
- **Respuesta**: Documento `JSON`:
  - `200`: La solicitud se completó satisfactoriamente:
    - `data`: Arreglo, cuyos elementos son objetos que tienen los siguientes campos:
      - `numero` (`int`): Número de Sala
      - `ubicación` (`string`): Piso en el que se ubica
      - `maxPersonas` (`int`): Número máximo de personas que puede tener la sala
      - `maxPersonas` (`int`): Número mínimo de personas que puede tener la sala
  - `401`: Operación no autorizada. Vea el mensaje del error.

### Enlistar las salas disponibles

- **Endpoint**: `/api/rooms/available`
- **Tipo de Request**: `GET`
- **Parámetros**:
  - `fecha`: Fecha en la que se desea revisar la disponibilidad de una sala
  - `horaInicio`: Hora de inicio en el formato `HH:MM`.
  - `horaFin`: Hora de fin en el formato `HH:MM`.
  - `capacidad` (opcional): Número de personas que la sala debe poder soportar, como mínimo.
- **Cuerpo de la Request**: Ninguno
- **Cabeceras**:
  - `Authorization`: `Bearer: {token_jwt}`
- **Respuesta**: Documento `JSON`:
  - `200`: La solicitud se completó satisfactoriamente:
    - `data`: Arreglo, cuyos elementos son objetos que tienen los siguientes campos:
      - `numero` (`int`): Número de Sala
      - `ubicación` (`string`): Piso en el que se ubica
      - `maxPersonas` (`int`): Número máximo de personas que puede tener la sala
      - `maxPersonas` (`int`): Número mínimo de personas que puede tener la sala
  - `401`: Operación no autorizada. Vea el mensaje del error.

### Enlistar las salas ocupadas

- **Endpoint**: `/api/rooms/used`
- **Tipo de Request**: `GET`
- **Parámetros**:
  - `fecha`: Fecha en la que se desea revisar la disponibilidad de una sala
  - `horaInicio`: Hora de inicio en el formato `HH:MM`.
  - `horaFin`: Hora de fin en el formato `HH:MM`.
  - `capacidad` (opcional): Número de personas que la sala debe poder soportar, como mínimo.
- **Cuerpo de la Request**: Ninguno
- **Cabeceras**:
  - `Authorization`: `Bearer: {token_jwt}`
- **Respuesta**: Documento `JSON`:
  - `200`: La solicitud se completó satisfactoriamente:
    - `data`: Arreglo, cuyos elementos son objetos que tienen los siguientes campos:
      - `numero` (`int`): Número de Sala
      - `ubicación` (`string`): Piso en el que se ubica
      - `maxPersonas` (`int`): Número máximo de personas que puede tener la sala
      - `maxPersonas` (`int`): Número mínimo de personas que puede tener la sala
  - `401`: Operación no autorizada. Vea el mensaje del error.

## Reservaciones

Estos endpoints **solamente permiten gestión de reservaciones como estudiantes**. Consule el endpoint adecuado si quiere cancelar reservaciones como administrador.

### Cancelar Reservación

- **Endpoint**: `/api/reservas/{id}/cancel`
- **Tipo de Request**: `PATCH`
- **Parámetros**: Ninguno
- **Cuerpo de la Request**: Ninguno
- **Cabeceras**:
  - `Authorization`: `Bearer: {token_jwt}`
- **Respuesta**: Documento `JSON`:
  - `200`: La solicitud se completó satisfactoriamente:
  - `401`: Operación no autorizada. Vea el mensaje del error.
  - `401`: Operación no autorizada. Vea el mensaje del error.

### Extender Reservación

- **Endpoint**: `/api/reservas/{id}/extend`
- **Tipo de Request**: `PATCH`
- **Parámetros**: Ninguno
- **Cuerpo de la Request**: Documento `JSON` (opcional):
  - `extensionHoras`: `decimal` (Cantidad de horas a extender la reserva, máximo `1.5`, el por defecto es `1`)
  - `notas`: `string` (opcional)
- **Cabeceras**:
  - `Authorization`: `Bearer: {token_jwt}` (Estudiante)
- **Respuesta**: Documento `JSON`:
  - `201`: La solicitud se completó satisfactoriamente:
    - `success`: `true`
    - `message`: `La solicitud de extensión ha sido enviada con éxito`
    - `data`: Objeto con los datos de la solicitud.
  - `400`: Error de validación o el usuario es incorrecto.
  - `401`: Operación no autorizada. Vea el mensaje del error.
  - `403`: Reservación no pertenece al estudiante.
  - `404`: No se encontró la reserva.

### Resolver Extensión

- **Endpoint**: `/api/reservas/extensions/{requestId}/resolve`
- **Tipo de Request**: `PATCH`
- **Parámetros**: Ninguno
- **Cuerpo de la Request**: Documento `JSON`:
  - `status`: `"Aprobada" | "Rechazada"`
- **Cabeceras**:
  - `Authorization`: `Bearer: {token_jwt}` (Personal)
- **Respuesta**: Documento `JSON`:
  - `200`: La solicitud fue resuelta exitosamente:
    - `success`: `true`
    - `message`: `La solicitud fue {status} exitosamente.`
    - `data`: Objeto con los datos de la solicitud.
  - `400`: Error de validación o ID de la solicitud inválido.
  - `401`: Operación no autorizada. Vea el mensaje del error.
  - `403`: Solo el personal de la biblioteca puede resolver solicitudes.
  - `404`: No se encontró la solicitud de extensión.
