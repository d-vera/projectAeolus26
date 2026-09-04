# Arquitectura del Backend — Air Project (Team 26)

## Visión General
Aplicación backend construida con **Spring Boot 3** y **Java 17**, encargada de la gestión de usuarios, almacenamiento de lecturas de calidad del aire e integración en tiempo real vía protocolo **MQTT**.

## Estructura de Paquetes (`com.airproject.airproject`)

- `controller/`: REST APIs y documentación OpenAPI.
- `service/`: Reglas de negocio e integración MQTT.
- `repository/`: Interfaces Spring Data JPA.
- `model/`: Entidades persistentes y Enums del dominio.
- `dto/`: DTOs de entrada y salida para APIs REST.
- `security/`: Autenticación JWT y filtros de Spring Security.
- `config/`: Configuración global (MQTT, Jackson, Swagger).
- `exception/`: Manejo global de excepciones (`@RestControllerAdvice`).

## Flujo de Datos
`Client / Frontend / Sensor` ──> `Controller / MqttSubscriber` ──> `Service` ──> `Repository` ──> `Database (JPA)`

## Convención de Commits
Se sigue el estándar Conventional Commits: `<tipo>(<ámbito>): <descripción>`
Ámbitos válidos: `auth`, `user`, `sensor`, `air-quality`, `mqtt`, `security`, `config`, `exception`.
