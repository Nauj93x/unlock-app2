# Unlock

**Unlock** es una plataforma web desarrollada como proyecto final académico para centralizar la gestión de **eventos, alojamientos, reservas, usuarios y procesos de check-in mediante códigos QR**.

---

## Descripción

**Unlock** es una plataforma web desarrollada como proyecto final académico para centralizar la gestión de **eventos, alojamientos, reservas, usuarios y procesos de check-in mediante códigos QR**.

La plataforma está orientada a facilitar la administración de eventos y servicios de alojamiento desde un mismo sistema, permitiendo gestionar información, disponibilidad, usuarios y reservas de acuerdo con los diferentes roles definidos dentro de la aplicación.

Uno de los principales objetivos del proyecto fue llevar los conceptos de **patrones de diseño de software** a una aplicación funcional, utilizando soluciones reutilizables para problemas comunes de diseño y buscando mantener una arquitectura con bajo acoplamiento, alta cohesión y responsabilidades bien definidas.

---

## Características principales

### Gestión de eventos

Permite administrar la información relacionada con los eventos disponibles dentro de la plataforma.

* Creación y administración de eventos.
* Gestión de fechas y horarios.
* Administración de ubicaciones.
* Control de capacidad.
* Consulta de información de eventos.

### Gestión de alojamientos

Permite administrar diferentes tipos de alojamiento y su disponibilidad.

* Habitaciones.
* Suites.
* Apartamentos.
* Precios.
* Disponibilidad.
* Características y amenidades.
* Gestión de reservas.

### Sistema de reservas

El sistema permite relacionar usuarios, eventos y alojamientos mediante un flujo de reservas.

* Creación de reservas.
* Consulta de disponibilidad.
* Asociación de reservas con usuarios.
* Gestión del estado de las reservas.
* Información necesaria para el proceso de check-in.

### Check-in mediante QR

Unlock incorpora un sistema de **check-in mediante códigos QR**, permitiendo validar una reserva de forma rápida y reducir la necesidad de procesos manuales.

El código QR funciona como mecanismo de identificación y validación asociado a la información de la reserva.

### Gestión de usuarios

La plataforma contempla diferentes tipos de usuarios y niveles de acceso.

* Administración de usuarios.
* Roles.
* Permisos.
* Diferenciación entre clientes y personal.
* Control de acceso a funcionalidades.

### Seguridad

El sistema contempla mecanismos de autenticación y autorización para controlar el acceso a las diferentes funcionalidades de la plataforma.

Los permisos disponibles dependen del rol asignado a cada usuario.

---

# Patrones de diseño

Uno de los componentes fundamentales de Unlock fue la aplicación práctica de **patrones de diseño GoF (Gang of Four)**.

Los patrones no fueron utilizados únicamente como ejercicios independientes, sino integrados dentro de una aplicación funcional para resolver problemas concretos de diseño y organización del código.

## Abstract Factory

El patrón **Abstract Factory** se utiliza para encapsular la creación de familias de objetos relacionados, evitando que el código cliente dependa directamente de las implementaciones concretas.

Dentro del proyecto, este enfoque permite manejar diferentes tipos de objetos relacionados manteniendo separada la lógica de creación de los componentes que los utilizan.

**Beneficios dentro del proyecto:**

* Encapsulamiento de la creación de objetos.
* Reducción del acoplamiento.
* Facilidad para incorporar nuevas familias de objetos.
* Separación entre creación y utilización.

---

## Builder

El patrón **Builder** permite construir objetos complejos paso a paso, separando el proceso de construcción de la representación final del objeto.

Este patrón resulta especialmente útil cuando una entidad posee múltiples atributos o configuraciones opcionales y se busca evitar constructores excesivamente complejos.

**Beneficios dentro del proyecto:**

* Construcción controlada de objetos.
* Mayor legibilidad al crear entidades complejas.
* Manejo de atributos opcionales.
* Separación del proceso de construcción.

---

## Adapter

El patrón **Adapter** permite que dos componentes con interfaces incompatibles puedan trabajar juntos mediante un adaptador.

En Unlock, este tipo de solución permite integrar componentes existentes dentro de la arquitectura sin necesidad de modificar directamente su implementación original.

**Beneficios dentro del proyecto:**

* Integración de componentes con interfaces diferentes.
* Reutilización de código existente.
* Reducción del acoplamiento.
* Mayor flexibilidad para reemplazar implementaciones.

---

## Facade

El patrón **Facade** proporciona una interfaz simplificada para interactuar con un conjunto de componentes o subsistemas.

Dentro de Unlock, este patrón permite ocultar la complejidad interna de determinadas operaciones y proporcionar a los componentes consumidores una interfaz más sencilla.

**Beneficios dentro del proyecto:**

* Simplificación del acceso a subsistemas.
* Menor dependencia entre componentes.
* Centralización de operaciones relacionadas.
* Mayor facilidad de mantenimiento.

---

## Bridge

El patrón **Bridge** permite separar una abstracción de su implementación para que ambas puedan evolucionar independientemente.

Este patrón ayuda a evitar jerarquías excesivamente rígidas y permite que diferentes abstracciones puedan utilizar distintas implementaciones sin quedar fuertemente acopladas.

**Beneficios dentro del proyecto:**

* Separación entre abstracción e implementación.
* Reducción del acoplamiento.
* Mayor flexibilidad.
* Facilidad para extender las implementaciones.

---

## ¿Por qué utilizar patrones de diseño?

La aplicación de patrones de diseño permitió abordar diferentes problemas de arquitectura y evitar que toda la lógica del sistema quedara directamente acoplada a clases concretas.

En particular, los patrones utilizados ayudaron a trabajar conceptos como:

* **Encapsulamiento de la creación de objetos.**
* **Separación de responsabilidades.**
* **Bajo acoplamiento.**
* **Alta cohesión.**
* **Reutilización de componentes.**
* **Extensibilidad.**
* **Abstracción.**
* **Separación entre interfaces e implementaciones.**

De esta manera, el proyecto permitió aplicar los patrones dentro de un contexto funcional en lugar de utilizarlos únicamente como implementaciones aisladas.

---

# Arquitectura

Unlock fue organizado siguiendo una arquitectura basada en la separación de responsabilidades, dividiendo el sistema en diferentes capas y componentes.

Una representación general de la arquitectura es:

```text
┌──────────────────────────────────────────────┐
│                 PRESENTACIÓN                 │
│                                              │
│        Interfaz de usuario / Frontend        │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│                 APLICACIÓN                   │
│                                              │
│       Controladores / Casos de uso           │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│                   DOMINIO                    │
│                                              │
│     Entidades / Reglas de negocio / DTOs     │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│                PERSISTENCIA                  │
│                                              │
│       Repositorios / Acceso a datos          │
└──────────────────────────────────────────────┘
```

La separación de estas responsabilidades permite que los cambios realizados en una capa tengan un impacto limitado sobre las demás.

Los patrones de diseño se incorporan sobre esta estructura para resolver problemas específicos de creación, comunicación, integración y organización de los componentes.

---

# Flujo general

Uno de los flujos principales de la plataforma puede representarse de la siguiente manera:

```text
                     ┌─────────────┐
                     │   Usuario   │
                     └──────┬──────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Autenticación y  │
                  │   autorización   │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │    Dashboard     │
                  └────────┬─────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     ┌─────────┐     ┌────────────┐   ┌──────────┐
     │ Eventos │     │Alojamientos│   │ Usuarios │
     └────┬────┘     └─────┬──────┘   └──────────┘
          │                │
          └────────┬───────┘
                   ▼
             ┌───────────┐
             │ Reservas  │
             └─────┬─────┘
                   │
                   ▼
             ┌───────────┐
             │ QR Check- │
             │    in     │
             └───────────┘
```

---

# Modelo conceptual

La plataforma gira alrededor de varias entidades principales relacionadas con el funcionamiento del sistema:

```text
                 ┌─────────────┐
                 │   Usuario   │
                 └──────┬──────┘
                        │
                        │ realiza
                        ▼
                 ┌─────────────┐
                 │   Reserva   │
                 └──────┬──────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
       ┌─────────────┐     ┌─────────────┐
       │    Evento   │     │ Alojamiento │
       └─────────────┘     └─────────────┘
              │                   │
              └─────────┬─────────┘
                        │
                        ▼
                  ┌───────────┐
                  │    QR     │
                  └───────────┘
```

---

# Principios de diseño

Además de los patrones de diseño, el proyecto se desarrolló teniendo en cuenta diferentes principios de ingeniería de software.

### Separación de responsabilidades

Cada componente debe encargarse de una responsabilidad específica, evitando concentrar demasiada lógica en una única clase o módulo.

### Bajo acoplamiento

Los componentes buscan depender lo menos posible de implementaciones concretas, facilitando su reemplazo y modificación.

### Alta cohesión

Las responsabilidades relacionadas se mantienen agrupadas dentro de componentes que tengan un propósito claro.

### Encapsulamiento

La implementación interna de los componentes se mantiene protegida, exponiendo únicamente las operaciones necesarias para interactuar con ellos.

### Extensibilidad

La utilización de abstracciones y patrones facilita incorporar nuevas funcionalidades sin tener que modificar grandes partes del sistema existente.

---

# Tecnologías

El proyecto fue desarrollado utilizando tecnologías orientadas al desarrollo de aplicaciones web y programación orientada a objetos.

* Java
* Spring Boot
* Maven
* HTML
* CSS
* JavaScript
* Base de datos relacional
* Git
* GitHub
* Docker

---

# Instalación

Clonar el repositorio:

```bash
git clone https://github.com/Nauj93x/unlock-app2.git
```

Ingresar al proyecto:

```bash
cd unlock-app2
```

Instalar las dependencias:

```bash
mvn clean install
```

Ejecutar la aplicación:

```bash
mvn spring-boot:run
```

La aplicación estará disponible en el puerto configurado por el proyecto.

---

# Contexto académico

Unlock fue desarrollado como **proyecto final académico** dentro del estudio de patrones de diseño y arquitectura de software.

El proyecto buscó llevar los conceptos vistos durante el curso a un sistema completo, pasando de ejemplos individuales de patrones a su aplicación dentro de una plataforma con diferentes módulos y flujos de negocio.

El desarrollo permitió trabajar conceptos como:

* Programación orientada a objetos.
* Principios SOLID.
* Patrones GoF.
* Arquitectura por capas.
* Abstracción.
* Encapsulamiento.
* Polimorfismo.
* Bajo acoplamiento.
* Alta cohesión.
* Diseño modular.
* Reutilización de componentes.

---

# Patrones implementados

| Patrón               | Categoría   | Propósito                                                  |
| -------------------- | ----------- | ---------------------------------------------------------- |
| **Abstract Factory** | Creacional  | Encapsular la creación de familias de objetos relacionados |
| **Builder**          | Creacional  | Construir objetos complejos de forma controlada            |
| **Adapter**          | Estructural | Permitir la colaboración entre interfaces incompatibles    |
| **Facade**           | Estructural | Simplificar el acceso a subsistemas complejos              |
| **Bridge**           | Estructural | Separar abstracción e implementación                       |

---

# Estado del proyecto

**Finalizado — Proyecto académico**

Unlock fue desarrollado como proyecto final y representa una implementación académica de una plataforma para la gestión de eventos, alojamientos, reservas y procesos de check-in.

El proyecto se encuentra orientado principalmente a demostrar la aplicación práctica de principios de diseño y patrones de software dentro de una aplicación funcional.

---

# Autor

**Juan Pablo**

Proyecto desarrollado individualmente como proyecto final académico.

---

# Licencia y derechos de autor

**Copyright © 2026 Juan Pablo. Todos los derechos reservados.**

Unlock es un proyecto académico desarrollado individualmente con fines educativos y de portafolio.

La publicación de este repositorio no implica la concesión de una licencia para copiar, modificar, distribuir, sublicenciar, publicar o utilizar comercialmente el código fuente, total o parcialmente.

Cualquier uso, reproducción, modificación o distribución del código requiere autorización previa y expresa del autor.

La disponibilidad pública del repositorio no constituye una autorización para reutilizar el código con fines comerciales ni para presentarlo como trabajo propio.
