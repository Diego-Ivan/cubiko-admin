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
  - `name`: `string`
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
  - `name`: `string`
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
- **Tipo de Request**: `POST`
- **Parámetros**: Ninguno
- **Cuerpo de la Request**: Ninguno
- **Cabeceras**:
  - `Authorization`: `Bearer: {token_jwt}`
- **Respuesta**: Documento `JSON`:
  - `200`: La solicitud se completó satisfactoriamente:
  - `401`: Operación no autorizada. Vea el mensaje del error.
  - `401`: Operación no autorizada. Vea el mensaje del error.
