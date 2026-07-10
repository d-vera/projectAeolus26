#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

#include <Wire.h>

#include <ArduinoJson.h>

#include <LittleFS.h>

#include <Adafruit_PM25AQI.h>

#include <SensirionI2cScd4x.h>

#include "time.h"

// ==================================================
// PINES
// ==================================================

#define SDA_PIN 21
#define SCL_PIN 22

// ==================================================
// WIFI
// ==================================================

const char* ssid = "miwifi";
const char* password = "1223456";

// ==================================================
// MQTT / EMQX
// ==================================================

const char* mqttServer = "b58901c6.ala.us-east-1.emqxsl.com";

const int mqttPort = 8883;

const char* mqttUser = "userNode1";

const char* mqttPassword = "cqVC$#234";

const char* mqttTopic = "calidad_aire/nodo1";

// Buffer MQTT
const uint16_t mqttBufferSize = 1024;

// ==================================================
// OBJETOS GLOBALES
// ==================================================

WiFiClientSecure espClient;

PubSubClient mqtt(espClient);

Adafruit_PM25AQI pmsa;

SensirionI2cScd4x scd4x;

JsonDocument doc;

// ==================================================
// IDENTIFICACIÓN DEL NODO
// ==================================================

String chipID;

String nombreNodo = "Node1";

const char* firmwareVersion = "2.2.0";

// ==================================================
// ESTADO DE SENSORES
// ==================================================

enum EstadoSensor
{
    SENSOR_OK = 0,
    SENSOR_NO_DETECTADO = 1,
    SENSOR_ERROR_LECTURA = 2,
    SENSOR_TIMEOUT = 3
};

uint8_t estadoSCD41 = SENSOR_NO_DETECTADO;

uint8_t estadoPMSA003I = SENSOR_NO_DETECTADO;

PM25_AQI_Data datosPM;

// ==================================================
// DATOS DE SENSORES
// ==================================================

float temperatura = 0;

float humedad = 0;

uint16_t co2 = 0;

uint16_t pm1 = 0;

uint16_t pm25 = 0;

uint16_t pm10 = 0;

uint16_t particulas03 = 0;

// ==================================================
// ESTADO DE COMUNICACIONES
// ==================================================

bool wifiOK = false;

bool mqttOK = false;

// ==================================================
// COLA OFFLINE
// ==================================================
bool offline = false;
uint16_t colaPendiente = 0;

const char* colaPath = "/cola.txt";

const char* colaTmpPath = "/cola_tmp.txt";

// ==================================================
// TIEMPO
// ==================================================

time_t timestamp = 0;

uint32_t sequence = 0;

// ==================================================
// TEMPORIZADORES
// ==================================================

unsigned long previousPublish = 0;

const uint32_t publishInterval = 15000;

unsigned long previousRecovery = 0;

const uint32_t recoveryInterval = 3000;

unsigned long previousMQTT = 0;

const uint32_t mqttReconnectInterval = 5000;

// ==================================================
// JSON
// ==================================================

char payload[768];

// ==================================================
// INICIALIZAR I2C
// ==================================================

void iniciarI2C()
{
    Wire.begin(SDA_PIN, SCL_PIN);

    Serial.println();
    Serial.println("Bus I2C inicializado");
}

// ==================================================
// INICIAR SCD41
// ==================================================

bool iniciarSCD41()
{
    uint16_t error;

    scd4x.begin(Wire, 0x62);

    error = scd4x.stopPeriodicMeasurement();

    delay(500);

    error = scd4x.startPeriodicMeasurement();

    if (error)
    {
        estadoSCD41 = SENSOR_NO_DETECTADO;

        Serial.println("SCD41 NO encontrado");

        return false;
    }

    estadoSCD41 = SENSOR_OK;

    Serial.println("SCD41 encontrado");

    return true;
}

// ==================================================
// INICIAR PMSA003I
// ==================================================

bool iniciarPMSA003I()
{
    if (!pmsa.begin_I2C())
    {
        estadoPMSA003I = SENSOR_NO_DETECTADO;

        Serial.println("PMSA003I NO encontrado");

        return false;
    }

    estadoPMSA003I = SENSOR_OK;

    Serial.println("PMSA003I encontrado");

    return true;
}

// ==================================================
// LEER SCD41
// ==================================================

void leerSCD41()
{
    uint16_t error;

    bool listo = false;

    error = scd4x.getDataReadyStatus(listo);

    if (error || !listo)
    {
        estadoSCD41 = SENSOR_TIMEOUT;

        Serial.println("SCD41: datos no disponibles");

        return;
    }

    error = scd4x.readMeasurement(
        co2,
        temperatura,
        humedad
    );

    if (error)
    {
        estadoSCD41 = SENSOR_ERROR_LECTURA;

        Serial.println("Error leyendo SCD41");

        return;
    }

    estadoSCD41 = SENSOR_OK;
}

// ==================================================
// LEER PMSA003I
// ==================================================

void leerPMSA003I()
{
    if (!pmsa.read(&datosPM))
    {
        estadoPMSA003I = SENSOR_ERROR_LECTURA;

        Serial.println("Error leyendo PMSA003I");

        return;
    }

    pm1 = datosPM.pm10_standard;

    pm25 = datosPM.pm25_standard;

    pm10 = datosPM.pm100_standard;

    particulas03 = datosPM.particles_03um;

    estadoPMSA003I = SENSOR_OK;
}

// ==================================================
// LEER TODOS LOS SENSORES
// ==================================================

void leerSensores()
{
    timestamp = time(nullptr);

    leerSCD41();

    leerPMSA003I();
}

// ==================================================
// OBTENER CHIP ID
// ==================================================

String obtenerChipID()
{
    uint64_t chipid = ESP.getEfuseMac();

    char id[17];

    sprintf(
        id,
        "%04X%08X",
        (uint16_t)(chipid >> 32),
        (uint32_t)chipid
    );

    return String(id);
}

// ==================================================
// CREAR JSON
// ==================================================

void crearJSON()
{
    doc.clear();

    JsonObject dispositivo =
        doc["dispositivo"].to<JsonObject>();

    dispositivo["id"] = chipID;

    dispositivo["nombre"] = nombreNodo;

    dispositivo["firmware"] = firmwareVersion;

    dispositivo["secuencia"] = sequence;

    dispositivo["timestamp"] = timestamp;

    dispositivo["offline"] = colaPendiente > 0;

    dispositivo["cola"] = colaPendiente;

    JsonObject estado =
        doc["estado"].to<JsonObject>();

    estado["scd41"] = estadoSCD41;

    estado["pmsa003i"] = estadoPMSA003I;

    JsonObject entorno =
        doc["entorno"].to<JsonObject>();

    entorno["temperatura"] = temperatura;

    entorno["humedad"] = humedad;

    JsonObject aire =
        doc["aire"].to<JsonObject>();

    aire["co2"] = co2;

    aire["pm1_0"] = pm1;

    aire["pm2_5"] = pm25;

    aire["pm10"] = pm10;

    aire["particulas03"] = particulas03;

    serializeJson(doc, payload);
}

// ==================================================
// LITTLEFS
// ==================================================

bool iniciarLittleFS()
{
    if (!LittleFS.begin(true))
    {
        Serial.println("Error LittleFS");

        return false;
    }

    Serial.println("LittleFS OK");

    if (!LittleFS.exists(colaPath))
    {
        File archivo =
            LittleFS.open(colaPath, "w");

        if (archivo)
            archivo.close();
    }

    colaPendiente = contarLineasCola();

    if (colaPendiente > 0)
    {
        Serial.print("Cola pendiente al arrancar: ");

        Serial.println(colaPendiente);
    }

    return true;
}

// ==================================================
// CONTAR ELEMENTOS DE LA COLA
// ==================================================

uint16_t contarLineasCola()
{
    if (!LittleFS.exists(colaPath))
        return 0;

    File archivo =
        LittleFS.open(colaPath, "r");

    if (!archivo)
        return 0;

    uint16_t lineas = 0;

    while (archivo.available())
    {
        String linea =
            archivo.readStringUntil('\n');

        linea.trim();

        if (linea.length() > 0)
            lineas++;
    }

    archivo.close();

    return lineas;
}

// ==================================================
// GUARDAR EN COLA
// ==================================================

bool guardarCola(const String& json)
{
    File archivo =
        LittleFS.open(colaPath, "a");

    if (!archivo)
    {
        Serial.println("No se pudo abrir cola");

        return false;
    }

    archivo.println(json);

    archivo.close();

    colaPendiente++;

    Serial.print("Medicion guardada en cola. Pendientes: ");

    Serial.println(colaPendiente);

    return true;
}

// ==================================================
// PUBLICAR MQTT
// ==================================================

bool publicarJSON(const String& json)
{
    if (!mqtt.connected())
        return false;

    bool enviado =
        mqtt.publish(
            mqttTopic,
            json.c_str()
        );

    if (enviado)
    {
        Serial.println("MQTT: publicado correctamente");
    }
    else
    {
        Serial.println("MQTT: error publicando");
    }

    return enviado;
}

// ==================================================
// ELIMINAR PRIMER ELEMENTO DE LA COLA
// ==================================================

bool eliminarPrimeraLineaCola()
{
    File origen =
        LittleFS.open(colaPath, "r");

    if (!origen)
        return false;

    File temporal =
        LittleFS.open(colaTmpPath, "w");

    if (!temporal)
    {
        origen.close();

        return false;
    }

    bool primeraLinea = true;

    while (origen.available())
    {
        String linea =
            origen.readStringUntil('\n');

        linea.trim();

        if (linea.length() == 0)
            continue;

        if (primeraLinea)
        {
            primeraLinea = false;

            continue;
        }

        temporal.println(linea);
    }

    origen.close();

    temporal.close();

    LittleFS.remove(colaPath);

    if (!LittleFS.rename(
            colaTmpPath,
            colaPath))
    {
        Serial.println(
            "Error reemplazando cola"
        );

        return false;
    }

    if (colaPendiente > 0)
        colaPendiente--;

    return true;
}

// ==================================================
// OBTENER PRIMER ELEMENTO DE LA COLA
// ==================================================

String obtenerPrimeraLineaCola()
{
    if (!LittleFS.exists(colaPath))
        return "";

    File archivo =
        LittleFS.open(colaPath, "r");

    if (!archivo)
        return "";

    String linea =
        archivo.readStringUntil('\n');

    archivo.close();

    linea.trim();

    return linea;
}

// ==================================================
// PROCESAR UNA MEDICIÓN DE LA COLA
// ==================================================

void procesarCola()
{
    if (!wifiOK)
        return;

    if (!mqtt.connected())
        return;

    if (colaPendiente == 0)
        return;

    String medicion =
        obtenerPrimeraLineaCola();

    if (medicion.length() == 0)
        return;

    Serial.println();
    Serial.println("Reenviando medicion pendiente...");

    Serial.print("Pendientes antes: ");

    Serial.println(colaPendiente);

    if (publicarJSON(medicion))
    {
        if (eliminarPrimeraLineaCola())
        {
            Serial.println(
                "Medicion eliminada de la cola"
            );

            Serial.print(
                "Pendientes despues: "
            );

            Serial.println(colaPendiente);
        }
    }
    else
    {
        Serial.println(
            "No se pudo enviar. "
            "La medicion permanece en cola."
        );
    }
}

// ==================================================
// PUBLICAR NUEVA MEDICIÓN
// ==================================================

void publicarMedicion()
{
    // Cada medición obtiene su propio número
    sequence++;

    timestamp = time(nullptr);

    crearJSON();

    Serial.println();

    Serial.print(
        "Nueva medicion. Secuencia: "
    );

    Serial.println(sequence);

    /*
       IMPORTANTE:

       Primero guardamos la medición.

       Así nunca dependemos de que MQTT
       esté disponible en ese instante.
    */

    if (!guardarCola(payload))
    {
        Serial.println(
            "ERROR CRITICO: "
            "no se pudo guardar la medicion"
        );

        return;
    }

    /*
       Si MQTT está disponible intentamos
       enviar inmediatamente.

       La cola sigue siendo la fuente
       de verdad.
    */

    if (mqtt.connected())
    {
        procesarCola();
    }

    offline = colaPendiente > 0;
}

// ==================================================
// CONEXIÓN WIFI
// ==================================================

void conectarWiFi()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        wifiOK = true;

        return;
    }

    wifiOK = false;

    Serial.println();
    Serial.println("Conectando WiFi...");

    WiFi.mode(WIFI_STA);

    WiFi.begin(
        ssid,
        password
    );

    unsigned long inicio =
        millis();

    while (
        WiFi.status() != WL_CONNECTED &&
        millis() - inicio < 20000
    )
    {
        delay(500);

        Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        wifiOK = true;

        Serial.println();

        Serial.println(
            "WiFi conectado"
        );

        Serial.print("IP: ");

        Serial.println(
            WiFi.localIP()
        );

        Serial.print("RSSI: ");

        Serial.print(
            WiFi.RSSI()
        );

        Serial.println(" dBm");
    }
    else
    {
        wifiOK = false;

        Serial.println();

        Serial.println(
            "No fue posible conectar al WiFi"
        );
    }
}

// ==================================================
// VERIFICAR WIFI
// ==================================================

void verificarWiFi()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        wifiOK = true;

        return;
    }

    if (wifiOK)
    {
        Serial.println();
        Serial.println(
            "Conexion WiFi perdida"
        );
    }

    wifiOK = false;

    conectarWiFi();
}

// ==================================================
// CONECTAR MQTT
// ==================================================

void conectarMQTT()
{
    if (!wifiOK)
        return;

    if (mqtt.connected())
    {
        mqttOK = true;

        return;
    }

    unsigned long ahora =
        millis();

    if (
        ahora - previousMQTT <
        mqttReconnectInterval
    )
    {
        return;
    }

    previousMQTT = ahora;

    Serial.println();

    Serial.println(
        "Intentando conectar a EMQX..."
    );

    if (
        mqtt.connect(
            chipID.c_str(),
            mqttUser,
            mqttPassword
        )
    )
    {
        mqttOK = true;

        Serial.println(
            "Broker EMQX conectado"
        );
    }
    else
    {
        mqttOK = false;

        Serial.print(
            "Error MQTT: "
        );

        Serial.println(
            mqtt.state()
        );
    }
}

// ==================================================
// VERIFICAR MQTT
// ==================================================

void verificarMQTT()
{
    if (
        mqtt.connected()
    )
    {
        mqttOK = true;

        return;
    }

    mqttOK = false;

    conectarMQTT();
}

// ==================================================
// IMPRIMIR SENSORES
// ==================================================

void imprimirSensores()
{
    Serial.println();

    Serial.println(
        "=========================="
    );

    Serial.print("CO2: ");

    Serial.print(co2);

    Serial.println(" ppm");

    Serial.print(
        "Temperatura: "
    );

    Serial.print(
        temperatura
    );

    Serial.println(" °C");

    Serial.print(
        "Humedad: "
    );

    Serial.print(
        humedad
    );

    Serial.println(" %");

    Serial.println();

    Serial.print("PM1.0: ");

    Serial.println(pm1);

    Serial.print("PM2.5: ");

    Serial.println(pm25);

    Serial.print("PM10: ");

    Serial.println(pm10);

    Serial.print(">0.3um: ");

    Serial.println(particulas03);

    Serial.println();

    Serial.print(
        "Estado SCD41: "
    );

    Serial.println(
        estadoSCD41
    );

    Serial.print(
        "Estado PMSA003I: "
    );

    Serial.println(
        estadoPMSA003I
    );

    Serial.println();

    Serial.print("WiFi: ");

    Serial.println(
        wifiOK
        ? "OK"
        : "DESCONECTADO"
    );

    Serial.print("MQTT: ");

    Serial.println(
        mqttOK
        ? "OK"
        : "DESCONECTADO"
    );

    Serial.print(
        "Cola pendiente: "
    );

    Serial.println(
        colaPendiente
    );

    crearJSON();

    Serial.println();

    Serial.println("JSON:");

    Serial.println(payload);

    Serial.println(
        "=========================="
    );
}

// ==================================================
// SETUP
// ==================================================

void setup()
{
    Serial.begin(115200);

    delay(1000);

    Serial.println();

    Serial.println(
        "========================"
    );

    Serial.println(
        "Firmware 2.2.0"
    );

    Serial.println(
        "========================"
    );

    chipID =
        obtenerChipID();

    iniciarI2C();

    iniciarSCD41();

    iniciarPMSA003I();

    iniciarLittleFS();

    WiFi.mode(WIFI_STA);

    conectarWiFi();

    configTime(
        -4 * 3600,
        0,
        "pool.ntp.org",
        "time.nist.gov"
    );

    delay(3000);

    espClient.setInsecure();

    mqtt.setBufferSize(
        mqttBufferSize
    );

    mqtt.setServer(
        mqttServer,
        mqttPort
    );

    conectarMQTT();

    previousPublish =
        millis();

    previousRecovery =
        millis();
}

// ==================================================
// LOOP
// ==================================================

void loop()
{
    // -----------------------------------------------
    // Comunicación
    // -----------------------------------------------

    verificarWiFi();

    verificarMQTT();

    mqtt.loop();

    unsigned long ahora =
        millis();

    // -----------------------------------------------
    // REENVÍO DE COLA
    //
    // Máximo UNA medición cada 3 segundos
    // -----------------------------------------------

    if (
        ahora - previousRecovery >=
        recoveryInterval
    )
    {
        previousRecovery = ahora;

        procesarCola();
    }

    // -----------------------------------------------
    // NUEVA MEDICIÓN CADA 15 SEGUNDOS
    // -----------------------------------------------

    if (
        ahora - previousPublish >=
        publishInterval
    )
    {
        previousPublish = ahora;

        leerSensores();

        imprimirSensores();

        publicarMedicion();
    }

    // -----------------------------------------------
    // Estado offline
    // -----------------------------------------------

    offline =
        colaPendiente > 0;
}